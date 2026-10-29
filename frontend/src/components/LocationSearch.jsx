import React, { useState, useEffect, useRef } from 'react';
import MapPinModal from './MapPinModal';
import './LocationSearch.css';

/**
 * LocationSearch Component
 * Modern unified hyperlocal location search bar with:
 *  - Inline Draggable Map Pin action button (Leaflet / OpenStreetMap).
 *  - Inline 1-click GPS auto-detection button.
 *  - Non-intrusive autocomplete suggestions (Photon + Nominatim fallback).
 *  - Persistent storage in localStorage so user's neighborhood is remembered.
 *  - Strict safety: Dropdown NEVER auto-opens on landing page or without user typing.
 */
function LocationSearch({
    onLocationSelect,
    placeholder = "Search area, street, society, village...",
    initialValue = "",
    showAutoDetect = true
}) {
    const [query, setQuery] = useState(initialValue || '');
    const [suggestions, setSuggestions] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isDetecting, setIsDetecting] = useState(false);
    const [statusText, setStatusText] = useState('');
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);
    const [selectedCoords, setSelectedCoords] = useState({ lat: 26.7017, lng: 92.8302 });

    const wrapperRef = useRef(null);
    const inputRef = useRef(null);
    const isUserTypingRef = useRef(false);

    // Sync initialValue when provided by parent without ever opening dropdown
    useEffect(() => {
        if (initialValue && initialValue !== query) {
            isUserTypingRef.current = false;
            setQuery(initialValue);
            setIsOpen(false);
            setSuggestions([]);
        }
    }, [initialValue]);

    // Close suggestions dropdown when clicking or touching outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setIsOpen(false);
                isUserTypingRef.current = false;
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside, { passive: true });
        document.addEventListener('pointerdown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
            document.removeEventListener('pointerdown', handleClickOutside);
        };
    }, []);

    // Autocomplete with Debounce (Photon API + Nominatim Fallback)
    useEffect(() => {
        if (!query || query.trim().length < 2) {
            setSuggestions([]);
            setIsOpen(false);
            return;
        }

        // CRITICAL: NEVER search or open dropdown on initial load, autofill or programmatic sync
        if (!isUserTypingRef.current) {
            setIsOpen(false);
            return;
        }

        setIsLoading(true);

        const debounceTimer = setTimeout(async () => {
            try {
                const cleanQuery = query.trim();
                let formatted = [];

                // 1. Try Photon Geocoding Engine (with India geographical bias)
                try {
                    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(cleanQuery)}&limit=8&lat=26.7017&lon=92.8302`;
                    const res = await fetch(photonUrl);
                    const data = await res.json();

                    if (data && Array.isArray(data.features) && data.features.length > 0) {
                        const seen = new Set();
                        for (const f of data.features) {
                            const p = f.properties || {};
                            const coords = f.geometry?.coordinates || []; // [lng, lat]
                            if (p.country && p.country !== 'India') continue;

                            const name = p.name || cleanQuery;
                            const region = [p.district, p.city, p.state].filter(Boolean).join(', ') || 'India';
                            const key = `${name}-${region}`.toLowerCase();

                            if (!seen.has(key)) {
                                seen.add(key);
                                formatted.push({
                                    id: p.osm_id || Math.random(),
                                    name: name,
                                    subtitle: region,
                                    lat: coords[1],
                                    lng: coords[0]
                                });
                            }
                        }
                    }
                } catch (photonErr) {
                    console.warn("Photon autocomplete failed, trying OpenStreetMap:", photonErr);
                }

                // 2. Fallback to OpenStreetMap Nominatim if Photon returned few/no results
                if (formatted.length === 0) {
                    try {
                        const osmUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanQuery)}&countrycodes=in&limit=6&addressdetails=1`;
                        const res = await fetch(osmUrl, {
                            headers: { 'Accept-Language': 'en' }
                        });
                        const osmData = await res.json();

                        if (Array.isArray(osmData)) {
                            formatted = osmData.map((item) => {
                                const addr = item.address || {};
                                const mainName = addr.suburb || addr.neighbourhood || addr.residential || addr.village || addr.road || item.name || item.display_name.split(',')[0];
                                const subtitle = [addr.city || addr.town || addr.county, addr.state].filter(Boolean).join(', ');

                                return {
                                    id: item.place_id,
                                    name: mainName,
                                    subtitle: subtitle || item.display_name,
                                    lat: parseFloat(item.lat),
                                    lng: parseFloat(item.lon)
                                };
                            });
                        }
                    } catch (osmErr) {
                        console.warn("Nominatim fallback failed:", osmErr);
                    }
                }

                setSuggestions(formatted);
                if (isUserTypingRef.current && formatted.length > 0) {
                    setIsOpen(true);
                } else {
                    setIsOpen(false);
                }
            } catch (err) {
                console.error("Autocomplete search error:", err);
            } finally {
                setIsLoading(false);
            }
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [query]);

    // Input handlers
    const handleInputChange = (e) => {
        const val = e.target.value;
        isUserTypingRef.current = true;
        setQuery(val);
        setStatusText('');
        if (!val.trim() || val.trim().length < 2) {
            setSuggestions([]);
            setIsOpen(false);
        }
    };

    const handleInputFocus = () => {
        // Only open if the user actively typed a search query before and there are suggestions
        if (isUserTypingRef.current && suggestions.length > 0) {
            setIsOpen(true);
        }
    };

    // Handle place selection from suggestions
    const handleSelectPlace = (place) => {
        isUserTypingRef.current = false;
        setQuery(place.name);
        setIsOpen(false);
        setSuggestions([]);
        setStatusText(`📍 Location: ${place.name}`);
        setSelectedCoords({ lat: place.lat, lng: place.lng });

        const locData = {
            name: place.name,
            subtitle: place.subtitle || '',
            lat: place.lat,
            lng: place.lng
        };

        try {
            localStorage.setItem('veggity_location', JSON.stringify(locData));
        } catch (_e) {}

        if (onLocationSelect) {
            onLocationSelect(locData);
        }
    };

    // Confirm location chosen from Draggable Pin Map Modal
    const handleMapPinConfirm = (place) => {
        isUserTypingRef.current = false;
        setQuery(place.name);
        setIsOpen(false);
        setSuggestions([]);
        setStatusText(`📍 Pin locked: ${place.name}`);
        setSelectedCoords({ lat: place.lat, lng: place.lng });

        const locData = {
            name: place.name,
            subtitle: '',
            lat: place.lat,
            lng: place.lng
        };

        try {
            localStorage.setItem('veggity_location', JSON.stringify(locData));
        } catch (_e) {}

        if (onLocationSelect) {
            onLocationSelect(locData);
        }
    };

    // 1-Click GPS Auto-Detect
    const handleAutoDetect = () => {
        if (!navigator.geolocation) {
            alert("Your browser does not support GPS location");
            return;
        }

        setIsDetecting(true);
        setStatusText("📡 Locating your exact GPS position...");
        setIsOpen(false);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                setSelectedCoords({ lat, lng });

                try {
                    let detectedName = '';
                    let subtitle = '';

                    try {
                        const osmUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
                        const res = await fetch(osmUrl, {
                            headers: {
                                'User-Agent': 'VeggityApp/1.0',
                                'Accept-Language': 'en'
                            }
                        });
                        const data = await res.json();
                        const addr = data.address || {};
                        const parts = (data.display_name || '').split(',').map((s) => s.trim());

                        const specific =
                            addr.amenity ||
                            addr.university ||
                            addr.college ||
                            addr.suburb ||
                            addr.neighbourhood ||
                            addr.residential ||
                            addr.village ||
                            addr.town ||
                            addr.city ||
                            parts[0];

                        const region = addr.city || addr.town || addr.county || addr.state_district || addr.state || parts[1] || '';
                        if (specific) {
                            detectedName = specific;
                            subtitle = region;
                        }
                    } catch (_osmErr) {}

                    const finalName = detectedName || `Current Location (${lat.toFixed(3)}, ${lng.toFixed(3)})`;
                    isUserTypingRef.current = false;
                    setQuery(finalName);
                    setStatusText(`📍 GPS locked: ${finalName}`);
                    setIsOpen(false);
                    setSuggestions([]);

                    const locData = { name: finalName, subtitle, lat, lng };
                    try {
                        localStorage.setItem('veggity_location', JSON.stringify(locData));
                    } catch (_err) {}

                    if (onLocationSelect) {
                        onLocationSelect(locData);
                    }
                } catch (err) {
                    console.error("Auto-detect failed:", err);
                    const fallbackName = `GPS (${lat.toFixed(3)}, ${lng.toFixed(3)})`;
                    isUserTypingRef.current = false;
                    setQuery(fallbackName);
                    setStatusText("📍 GPS locked");
                    setIsOpen(false);
                    if (onLocationSelect) {
                        onLocationSelect({ name: fallbackName, lat, lng });
                    }
                } finally {
                    setIsDetecting(false);
                }
            },
            (err) => {
                setIsDetecting(false);
                console.error("Geolocation error:", err);
                setStatusText("⚠️ Location permission denied. Please search or pick pin on map.");
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleClear = () => {
        isUserTypingRef.current = false;
        setQuery('');
        setSuggestions([]);
        setIsOpen(false);
        setStatusText('');
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    return (
        <div className="location-box-wrapper" ref={wrapperRef}>
            {/* Unified Modern Search Bar (With Inline Pin-on-Map and Auto-Detect) */}
            <div className="location-search-bar">
                <span className="search-pin-icon" aria-hidden="true">📍</span>
                <input
                    ref={inputRef}
                    type="text"
                    className="location-input-field"
                    value={query}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
                    onChange={handleInputChange}
                    placeholder={placeholder}
                    onFocus={handleInputFocus}
                    onKeyDown={(e) => {
                        if (e.key === 'Escape') setIsOpen(false);
                    }}
                />

                <div className="search-inline-actions">
                    {query && (
                        <button
                            type="button"
                            className="btn-inline-clear"
                            onClick={handleClear}
                            title="Clear input"
                            aria-label="Clear location input"
                        >
                            ✕
                        </button>
                    )}

                    <span className="search-actions-divider" aria-hidden="true" />

                    {/* 🗺️ In-Search Pin on Map Action Button */}
                    <button
                        type="button"
                        className="btn-search-action btn-action-map"
                        onClick={() => {
                            setIsOpen(false);
                            setIsMapModalOpen(true);
                        }}
                        title="Choose pin on interactive map"
                        aria-label="Choose pin on interactive map"
                    >
                        <span className="action-btn-icon">🗺️</span>
                        <span className="action-btn-text">Map</span>
                    </button>

                    {/* 🎯 In-Search GPS Auto Detect Action Button */}
                    {showAutoDetect && (
                        <button
                            type="button"
                            className={`btn-search-action btn-action-gps ${isDetecting ? 'is-detecting' : ''}`}
                            onClick={handleAutoDetect}
                            disabled={isDetecting}
                            title="Detect current GPS location"
                            aria-label="Detect current GPS location"
                        >
                            <span className="action-btn-icon">{isDetecting ? '📡' : '🎯'}</span>
                            <span className="action-btn-text">{isDetecting ? 'Locating...' : 'GPS'}</span>
                        </button>
                    )}
                </div>
            </div>

            {isLoading && <small className="loading-hint">Searching nearby places...</small>}

            {/* Suggestions Dropdown (Only genuine matching places when user types) */}
            {isOpen && suggestions.length > 0 && (
                <ul className="suggestions-list" role="listbox">
                    {suggestions.map((place) => (
                        <li key={place.id} onClick={() => handleSelectPlace(place)} role="option">
                            <strong>📍 {place.name}</strong>
                            {place.subtitle && <small>{place.subtitle}</small>}
                        </li>
                    ))}
                </ul>
            )}

            {statusText && <div className="status-badge">{statusText}</div>}

            {/* Interactive Leaflet Map Pin Modal */}
            <MapPinModal
                isOpen={isMapModalOpen}
                onClose={() => setIsMapModalOpen(false)}
                onConfirm={handleMapPinConfirm}
                initialLat={selectedCoords.lat}
                initialLng={selectedCoords.lng}
                initialPlaceName={query}
            />
        </div>
    );
}

export default LocationSearch;
