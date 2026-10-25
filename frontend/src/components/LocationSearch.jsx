import React, { useState, useEffect, useRef } from 'react';
import MapPinModal from './MapPinModal';
import './LocationSearch.css';

/**
 * LocationSearch Component
 * Accurate hyperlocal location picker with:
 *  - Interactive Draggable Map Pin selection (Leaflet / OpenStreetMap).
 *  - 1-click GPS auto-detection with fine-grained locality extraction.
 *  - Fast autocomplete search (Photon + OpenStreetMap Nominatim fallback).
 *  - Persistent storage in localStorage so user's neighborhood is remembered.
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

    // Sync initialValue if provided or changed by parent
    useEffect(() => {
        if (initialValue && !query) {
            setQuery(initialValue);
        }
    }, [initialValue]);

    // Close suggestions dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Autocomplete with Debounce (Photon API + Nominatim Fallback)
    useEffect(() => {
        if (!query || query.trim().length < 2) {
            return;
        }

        setIsLoading(true);

        const debounceTimer = setTimeout(async () => {
            try {
                const cleanQuery = query.trim();
                let formatted = [];

                // 1. Try Photon Geocoding Engine (with India geographical bias)
                try {
                    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(cleanQuery)}&limit=10&lat=26.7017&lon=92.8302`;
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
                        const osmUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanQuery)}&countrycodes=in&limit=8&addressdetails=1`;
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
                setIsOpen(true);
            } catch (err) {
                console.error("Autocomplete search error:", err);
            } finally {
                setIsLoading(false);
            }
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [query]);

    // Handle place selection from suggestions
    const handleSelectPlace = (place) => {
        setQuery(place.name);
        setIsOpen(false);
        setStatusText(`📍 Location set: ${place.name}`);
        setSelectedCoords({ lat: place.lat, lng: place.lng });

        try {
            localStorage.setItem('veggity_location', JSON.stringify({
                name: place.name,
                subtitle: place.subtitle || '',
                lat: place.lat,
                lng: place.lng
            }));
        } catch (_e) {}

        if (onLocationSelect) {
            onLocationSelect({
                name: place.name,
                subtitle: place.subtitle,
                lat: place.lat,
                lng: place.lng
            });
        }
    };

    // Confirm location chosen from Draggable Pin Map Modal
    const handleMapPinConfirm = (place) => {
        setQuery(place.name);
        setStatusText(`📍 Pin locked: ${place.name}`);
        setSelectedCoords({ lat: place.lat, lng: place.lng });

        try {
            localStorage.setItem('veggity_location', JSON.stringify({
                name: place.name,
                subtitle: '',
                lat: place.lat,
                lng: place.lng
            }));
        } catch (_e) {}

        if (onLocationSelect) {
            onLocationSelect({
                name: place.name,
                subtitle: '',
                lat: place.lat,
                lng: place.lng
            });
        }
    };

    // Blinkit/Zepto 1-Click GPS Auto-Detect
    const handleAutoDetect = () => {
        if (!navigator.geolocation) {
            alert("Your browser does not support GPS location");
            return;
        }

        setIsDetecting(true);
        setStatusText("📡 Locating your exact GPS position...");

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
                    setQuery(finalName);
                    setStatusText(`📍 GPS locked: ${finalName}`);
                    setIsOpen(false);

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
                    setQuery(fallbackName);
                    setStatusText("📍 GPS locked");
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
        setQuery('');
        setSuggestions([]);
        setStatusText('');
    };

    return (
        <div className="location-box-wrapper" ref={wrapperRef}>
            {/* Row 1: Full-Width Search Input (Never squished) */}
            <div className="location-search-bar">
                <span className="search-pin-icon">📍</span>
                <input
                    type="text"
                    className="location-input-field"
                    value={query}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setStatusText('');
                        if (!e.target.value) {
                            setSuggestions([]);
                        }
                    }}
                    placeholder={placeholder}
                    onFocus={() => setIsOpen(true)}
                />
                {query && (
                    <button
                        type="button"
                        className="btn-clear-input"
                        onClick={handleClear}
                        title="Clear location"
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* Row 2: Location Action Buttons (Pin on Map + GPS Auto-Detect) */}
            <div className="location-actions-bar">
                {/* 📍 Interactive Pin on Map Picker */}
                <button
                    type="button"
                    className="btn-pick-pin-map"
                    onClick={() => setIsMapModalOpen(true)}
                    title="Open map to drag and place pin accurately"
                >
                    <span className="action-btn-icon">📍</span>
                    <span className="action-btn-text">Choose Pin on Map</span>
                </button>

                {/* 🎯 Device GPS Auto-Detect */}
                {showAutoDetect && (
                    <button
                        type="button"
                        className="btn-auto-detect-gps"
                        onClick={handleAutoDetect}
                        disabled={isDetecting}
                        title="Detect GPS coordinates instantly"
                    >
                        <span className="action-btn-icon">{isDetecting ? '📡' : '🎯'}</span>
                        <span className="action-btn-text">{isDetecting ? 'Locating...' : 'Auto Detect GPS'}</span>
                    </button>
                )}
            </div>

            {isLoading && <small className="loading-hint">Searching nearby places...</small>}

            {/* Suggestions & Quick Dropdown */}
            {isOpen && (
                <ul className="suggestions-list">
                    {/* 1-Tap Pin on Map option */}
                    <li
                        className="dropdown-action-item pin-map-item"
                        onClick={() => {
                            setIsOpen(false);
                            setIsMapModalOpen(true);
                        }}
                    >
                        <div className="action-item-content">
                            <span className="action-item-icon">📍</span>
                            <div>
                                <strong>Choose Accurate Location with Pin</strong>
                                <small>Drag pin on interactive map for exact spot</small>
                            </div>
                        </div>
                    </li>

                    {/* 1-Tap GPS Auto Detect option */}
                    <li className="dropdown-action-item gps-item" onClick={handleAutoDetect}>
                        <div className="action-item-content">
                            <span className="action-item-icon">🎯</span>
                            <div>
                                <strong>Use Current Location</strong>
                                <small>Auto-detect using device GPS</small>
                            </div>
                        </div>
                    </li>

                    {suggestions.map((place) => (
                        <li key={place.id} onClick={() => handleSelectPlace(place)}>
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
