import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapPinModal.css';

// Fix for default Leaflet marker icons in Vite bundler
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function MapPinModal({
    isOpen,
    onClose,
    onConfirm,
    initialLat = 26.7017,
    initialLng = 92.8302,
    initialPlaceName = ''
}) {
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerRef = useRef(null);

    const [isMapReady, setIsMapReady] = useState(false);
    const [currentCoords, setCurrentCoords] = useState({
        lat: Number(initialLat) || 26.7017,
        lng: Number(initialLng) || 92.8302
    });
    const [placeLabel, setPlaceLabel] = useState(initialPlaceName || 'Tezpur University, Assam');
    const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

    // Completely destroy Leaflet instance and clean DOM container
    const destroyMap = useCallback(() => {
        if (mapInstanceRef.current) {
            try {
                mapInstanceRef.current.off();
                mapInstanceRef.current.remove();
            } catch (err) {
                console.warn('Map cleanup notice:', err);
            }
            mapInstanceRef.current = null;
            markerRef.current = null;
        }
        if (mapContainerRef.current) {
            delete mapContainerRef.current._leaflet_id;
        }
        setIsMapReady(false);
    }, []);

    // Reverse geocode whenever pin moves
    const reverseGeocode = async (lat, lng) => {
        setIsReverseGeocoding(true);
        try {
            const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
            const res = await fetch(url, {
                headers: { 'Accept-Language': 'en' }
            });
            const data = await res.json();
            const addr = data.address || {};
            const parts = (data.display_name || '').split(',').map((s) => s.trim());

            const specific =
                addr.amenity ||
                addr.university ||
                addr.college ||
                addr.building ||
                addr.suburb ||
                addr.neighbourhood ||
                addr.residential ||
                addr.village ||
                addr.town ||
                addr.city ||
                parts[0];

            const region = addr.city || addr.town || addr.county || addr.state_district || addr.state || '';
            const finalName = specific
                ? (region && region !== specific ? `${specific}, ${region}` : specific)
                : `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

            setPlaceLabel(finalName);
        } catch (_err) {
            setPlaceLabel(`Pin (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
        } finally {
            setIsReverseGeocoding(false);
        }
    };

    // Initialize fresh Leaflet map whenever modal opens
    useEffect(() => {
        if (!isOpen) {
            destroyMap();
            return;
        }

        let isCancelled = false;

        // Small tick to ensure mapContainerRef.current is mounted and dimensioned
        const timer = setTimeout(() => {
            if (isCancelled || !mapContainerRef.current) return;

            // Wipe out any prior instance or stray _leaflet_id
            destroyMap();

            const startLat = Number(initialLat) || 26.7017;
            const startLng = Number(initialLng) || 92.8302;

            try {
                // Initialize Map
                const map = L.map(mapContainerRef.current, {
                    center: [startLat, startLng],
                    zoom: 16,
                    zoomControl: false,
                    attributionControl: true
                });

                // Zoom control top-right
                L.control.zoom({ position: 'topright' }).addTo(map);

                // High-reliability Tile Layer with global CDN
                const tileLayer = L.tileLayer(
                    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                    {
                        maxZoom: 19,
                        attribution: '© OpenStreetMap contributors',
                        subdomains: ['a', 'b', 'c']
                    }
                );
                tileLayer.addTo(map);

                // Draggable Marker
                const marker = L.marker([startLat, startLng], {
                    draggable: true,
                    autoPan: true
                }).addTo(map);

                marker.bindPopup("<b>📍 Move me!</b><br>Drag pin or tap anywhere on the map to set location.").openPopup();

                // When user drags pin
                marker.on('dragend', () => {
                    const pos = marker.getLatLng();
                    setCurrentCoords({ lat: pos.lat, lng: pos.lng });
                    reverseGeocode(pos.lat, pos.lng);
                });

                // When user clicks anywhere on map, move pin there
                map.on('click', (e) => {
                    marker.setLatLng(e.latlng);
                    setCurrentCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
                    reverseGeocode(e.latlng.lat, e.latlng.lng);
                });

                mapInstanceRef.current = map;
                markerRef.current = marker;
                setIsMapReady(true);

                // Trigger size invalidation immediately and with staggered delays
                // to guarantee tile rendering even during CSS modal animation transitions
                map.invalidateSize();
                setTimeout(() => {
                    if (!isCancelled && mapInstanceRef.current) {
                        mapInstanceRef.current.invalidateSize();
                    }
                }, 80);
                setTimeout(() => {
                    if (!isCancelled && mapInstanceRef.current) {
                        mapInstanceRef.current.invalidateSize();
                    }
                }, 250);
                setTimeout(() => {
                    if (!isCancelled && mapInstanceRef.current) {
                        mapInstanceRef.current.invalidateSize();
                    }
                }, 500);

                setCurrentCoords({ lat: startLat, lng: startLng });
                if (initialPlaceName) {
                    setPlaceLabel(initialPlaceName);
                } else {
                    reverseGeocode(startLat, startLng);
                }
            } catch (err) {
                console.error('Error initializing Leaflet map:', err);
            }
        }, 50);

        return () => {
            isCancelled = true;
            clearTimeout(timer);
            destroyMap();
        };
    }, [isOpen, destroyMap]); // Notice: only depends on isOpen and destroyMap!

    // ResizeObserver: Auto invalidate size if container dimensions change (e.g. mobile keyboard/rotation)
    useEffect(() => {
        if (!isMapReady || !mapContainerRef.current || !mapInstanceRef.current) return;

        const ro = new ResizeObserver(() => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.invalidateSize();
            }
        });

        ro.observe(mapContainerRef.current);
        return () => ro.disconnect();
    }, [isMapReady]);

    // 1-Click Center on Device GPS
    const handleLocateMe = () => {
        if (!navigator.geolocation) {
            alert('Your browser does not support GPS');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                setCurrentCoords({ lat, lng });

                if (mapInstanceRef.current && markerRef.current) {
                    mapInstanceRef.current.setView([lat, lng], 16);
                    markerRef.current.setLatLng([lat, lng]);
                    mapInstanceRef.current.invalidateSize();
                }
                reverseGeocode(lat, lng);
            },
            (err) => {
                console.error(err);
                alert('GPS location permission denied or timed out');
            },
            { enableHighAccuracy: true }
        );
    };

    const handleConfirm = () => {
        onConfirm({
            name: placeLabel,
            lat: currentCoords.lat,
            lng: currentCoords.lng
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="map-modal-backdrop" onClick={onClose}>
            <div className="map-modal-card" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="map-modal-header">
                    <div>
                        <h3>📍 Pick Exact Location with Pin</h3>
                        <p>Drag the pin or tap anywhere on the map to pinpoint your exact spot.</p>
                    </div>
                    <button className="btn-close-map" onClick={onClose}>✕</button>
                </div>

                {/* Map Viewport Container */}
                <div className="map-viewport-wrapper">
                    {!isMapReady && (
                        <div className="map-loading-overlay">
                            <div className="map-mini-spinner" />
                            <span>Loading Interactive Map...</span>
                        </div>
                    )}

                    <div ref={mapContainerRef} className="leaflet-map-div" />

                    {/* GPS Floating Center Button */}
                    <button
                        type="button"
                        className="btn-map-gps-float"
                        onClick={handleLocateMe}
                        title="Jump to my GPS position"
                    >
                        🎯 Center on My GPS
                    </button>
                </div>

                {/* Footer with selected location info & confirm action */}
                <div className="map-modal-footer">
                    <div className="selected-pin-info">
                        <span className="pin-label-title">📍 Selected Location:</span>
                        <strong className="pin-place-text">
                            {isReverseGeocoding ? 'Detecting address...' : placeLabel}
                        </strong>
                        <span className="pin-coords-text">
                            GPS: {currentCoords.lat.toFixed(5)}, {currentCoords.lng.toFixed(5)}
                        </span>
                    </div>

                    <div className="map-modal-actions">
                        <button type="button" className="btn-cancel-map" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="button" className="btn-confirm-map" onClick={handleConfirm}>
                            🌿 Confirm Pin Location
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MapPinModal;
