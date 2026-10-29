import React, { useEffect, useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { API_URL, handleSuccess, handleError } from '../utils';
import LocationSearch from '../components/LocationSearch';
import CartDrawer from '../components/CartDrawer';
import ProductDetailsModal from '../components/ProductDetailsModal';
import UserProfileMenu from '../components/UserProfileMenu';
import AccountDetailsModal from '../components/AccountDetailsModal';
import MyOrdersModal from '../components/MyOrdersModal';
import { useCart } from '../context/CartContext';
import { ToastContainer } from 'react-toastify';
import './Home.css';

// Whitelist of vegetable categories matching backend schema
const CATEGORIES = [
    { label: 'All Vegetables', value: 'all' },
    { label: '🌿 Leafy', value: 'Leafy Vegetables' },
    { label: '🍅 Fruit Veggies', value: 'Fruit Vegetables' },
    { label: '🥕 Roots', value: 'Root Vegetables' },
    { label: '🧅 Bulbs', value: 'Bulb Vegetables' },
    { label: '🌱 Herbs', value: 'Herbs' },
    { label: '🥦 Others', value: 'Other Vegetables' }
];

// Helper: Calculate dynamic countdown freshness badge from expiresAt
const getFreshnessBadge = (expiresAt) => {
    const diffMs = new Date(expiresAt).getTime() - Date.now();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));

    if (diffHours <= 0) {
        return { text: 'Expired', badgeClass: 'badge-expired' };
    }
    if (diffHours < 12) {
        return { text: `⏰ ${diffHours}h left`, badgeClass: 'badge-urgent' };
    }
    if (diffHours < 24) {
        return { text: `⏰ ${diffHours}h left`, badgeClass: 'badge-warning' };
    }
    const days = Math.floor(diffHours / 24);
    return { text: `🌿 ${days}d fresh`, badgeClass: 'badge-fresh' };
};

function Home() {
    const location = useLocation();

    // 1. Cart Context
    const {
        addToCart,
        updateQuantity,
        getItemQuantity,
        totalItems,
        totalAmount,
        setIsCartOpen
    } = useCart();

    // 2. User state initialized directly from localStorage
    const [loggedInUser, setLoggedInUser] = useState(() => localStorage.getItem('loggedInUser') || '');
    const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(localStorage.getItem('token')));

    // 3. Location state (defaults to Tezpur University if not already chosen in localStorage)
    const [currentLocation, setCurrentLocation] = useState(() => {
        try {
            const saved = localStorage.getItem('veggity_location');
            if (saved) return JSON.parse(saved);
        } catch (_err) {}
        return {
            name: 'Tezpur University',
            subtitle: 'Napaam, Tezpur, Sonitpur, Assam',
            lat: 26.7017,
            lng: 92.8302
        };
    });

    // 4. Search & filter state
    const [radiusKm, setRadiusKm] = useState(5);
    const [selectedCategory, setSelectedCategory] = useState('all');

    // 5. Products list & loading states (with instant session cache)
    const [products, setProducts] = useState(() => {
        try {
            const cached = sessionStorage.getItem('veggity_cached_products');
            if (cached) return JSON.parse(cached);
        } catch (_e) {}
        return [];
    });
    const [loading, setLoading] = useState(false);
    const [isSlowLoading, setIsSlowLoading] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    // 6. User Profile Modals state
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);

    // Fetch nearby unexpired produce from backend
    const fetchNearbyProduce = useCallback(async (lat, lng, radius, category) => {
        if (!lat || !lng) return;

        setLoading(true);
        setIsSlowLoading(false);

        // Timer to detect if Render backend is in cold-start wakeup (> 3.5s)
        const slowTimer = setTimeout(() => {
            setIsSlowLoading(true);
        }, 3500);

        try {
            let url = `${API_URL}/products/nearby?latitude=${lat}&longitude=${lng}&radiusKm=${radius}`;
            if (category && category !== 'all') {
                url += `&category=${encodeURIComponent(category)}`;
            }

            const response = await fetch(url);
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.warn(`Non-JSON response from ${url} (HTTP ${response.status}):`, text.slice(0, 150));
                if (response.status === 404) {
                    handleError(`Backend at ${API_URL} returned 404. Latest backend code needs to be deployed on Render.`);
                } else if (response.status >= 500) {
                    handleError(`Backend is spinning up (HTTP ${response.status}). Free tier takes ~30s on first load.`);
                } else {
                    handleError(`Backend returned invalid response (${response.status})`);
                }
                return;
            }

            const data = await response.json();

            if (data.success) {
                const list = data.products || [];
                setProducts(list);
                try {
                    sessionStorage.setItem('veggity_cached_products', JSON.stringify(list));
                } catch (_e) {}
            } else {
                handleError(data.message || 'Failed to fetch produce');
            }
        } catch (err) {
            console.error('Fetch error:', err);
            handleError(`Cannot connect to backend at ${API_URL}. If on mobile, ensure port 8080 is forwarded or on same Wi-Fi.`);
        } finally {
            clearTimeout(slowTimer);
            setLoading(false);
            setIsSlowLoading(false);
        }
    }, []);

    // Re-fetch when location, radius, or category changes
    useEffect(() => {
        if (currentLocation && currentLocation.lat && currentLocation.lng) {
            fetchNearbyProduce(currentLocation.lat, currentLocation.lng, radiusKm, selectedCategory);
        }
    }, [currentLocation, radiusKm, selectedCategory, fetchNearbyProduce]);

    // Handle location selection from LocationSearch
    const handleLocationSelect = (loc) => {
        setCurrentLocation(loc);
    };

    // Logout handler
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('loggedInUser');
        setIsLoggedIn(false);
        setLoggedInUser('');
        handleSuccess('Logged out successfully');
    };

    return (
        <div className="home-container">
            {/* Top Navigation Bar */}
            <header className="navbar">
                <div className="nav-brand">
                    <span className="brand-logo">🌱</span>
                    <div className="brand-text-group">
                        <span className="brand-name">Veggity</span>
                        <span className="brand-tag">Hyperlocal Fresh Produce</span>
                    </div>
                </div>

                <div className="nav-right">
                    {/* Cart Button (Always visible on all screens) */}
                    <button className="btn-nav-cart" onClick={() => setIsCartOpen(true)}>
                        <span className="cart-btn-icon">🛒</span>
                        <span className="cart-btn-label">Cart</span>
                        {totalItems > 0 && (
                            <span className="nav-cart-badge">{totalItems} • ₹{totalAmount}</span>
                        )}
                    </button>

                    {/* Desktop action buttons */}
                    <div className="desktop-nav-actions">
                        {isLoggedIn && (
                            <Link to="/orders" className="btn-nav-orders">
                                🛍️ My Purchases
                            </Link>
                        )}

                        {isLoggedIn && (
                            <Link to="/dashboard" className="btn-nav-dashboard">
                                📊 Grower Dashboard
                            </Link>
                        )}

                        <Link to="/add-produce" className="btn-nav-sell">
                            + Sell Produce
                        </Link>

                        {isLoggedIn ? (
                            <UserProfileMenu
                                userName={loggedInUser}
                                onLogout={handleLogout}
                                onOpenAccountDetails={() => setIsAccountModalOpen(true)}
                                onOpenOrders={() => navigate('/orders')}
                            />
                        ) : (
                            <div className="auth-buttons">
                                <Link to="/login" className="btn-login-link">Login</Link>
                                <Link to="/signup" className="btn-signup-link">Sign Up</Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile Profile or Login */}
                    <div className="mobile-nav-actions">
                        {isLoggedIn ? (
                            <UserProfileMenu
                                userName={loggedInUser}
                                onLogout={handleLogout}
                                onOpenAccountDetails={() => setIsAccountModalOpen(true)}
                                onOpenOrders={() => navigate('/orders')}
                            />
                        ) : (
                            <Link to="/login" className="btn-login-link-mobile">Login</Link>
                        )}
                    </div>
                </div>
            </header>

            {/* Location & Hero Section */}
            <section className="hero-section">
                <div className="hero-content">
                    <h1 className="hero-title">Garden-Fresh Vegetables From Your Neighbors</h1>
                    <p className="hero-subtitle">Discover harvest from home gardens within 5–10 km before it perishes.</p>

                    {/* Integrated Location Search Bar */}
                    <div className="search-bar-container">
                        <LocationSearch
                            placeholder="Search area, colony or click Auto Detect..."
                            initialValue={currentLocation?.name || ''}
                            onLocationSelect={handleLocationSelect}
                        />
                    </div>
                </div>
            </section>

            {/* Filters Bar: Radius & Categories */}
            <section className="filters-section">
                <div className="filters-inner">
                    {/* Radius Distance Selector */}
                    <div className="radius-selector-scroll">
                        <span className="filter-label">Distance:</span>
                        <div className="radius-pills-row">
                            {[5, 10, 20].map((r) => (
                                <button
                                    key={r}
                                    className={`radius-pill ${radiusKm === r ? 'active' : ''}`}
                                    onClick={() => setRadiusKm(r)}
                                >
                                    {r === 5 ? `⚡ ${r} km` : `📍 ${r} km`}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Horizontal Scrollable Category Filter Chips */}
                    <div className="category-chips-scroll">
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat.value}
                                className={`category-chip ${selectedCategory === cat.value ? 'active' : ''}`}
                                onClick={() => setSelectedCategory(cat.value)}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Main Content Area */}
            <main className="main-content">
                {/* Active location indicator */}
                <div className="location-indicator">
                    {currentLocation && (
                        <div className="active-location-badge">
                            📍 Fresh harvest near <strong>{currentLocation.name}</strong> ({radiusKm} km radius)
                        </div>
                    )}
                </div>

                {/* Loading Spinner */}
                {loading && products.length === 0 && (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Finding fresh produce from nearby neighbors...</p>
                        {isSlowLoading && (
                            <p className="slow-loading-hint">
                                ⚡ Waking up live server... Thanks for your patience on the first load!
                            </p>
                        )}
                    </div>
                )}

                {/* Subtle updating indicator if background refresh while displaying cached items */}
                {loading && products.length > 0 && (
                    <div className="background-refresh-bar">
                        <span className="refresh-dot"></span>
                        Checking for latest harvests...
                    </div>
                )}

                {/* Produce Grid (Optimized 2-Column on Mobile like Blinkit & Zepto) */}
                {currentLocation && products.length > 0 && (
                    <div className="produce-grid">
                        {products.map((item) => {
                            const freshness = getFreshnessBadge(item.expiresAt);
                            const itemQtyInCart = getItemQuantity(item._id);

                            return (
                                <div
                                    key={item._id}
                                    className="produce-card"
                                    onClick={() => setSelectedProduct(item)}
                                >
                                    {/* Vegetable Thumbnail Image with Overlay Badges */}
                                    <div className="card-image-box">
                                        <img
                                            src={item.imageUrl || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&auto=format&fit=crop&q=80'}
                                            alt={item.title}
                                            className="card-thumb-img"
                                            loading="lazy"
                                            onError={(e) => {
                                                e.target.src = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&auto=format&fit=crop&q=80';
                                            }}
                                        />
                                        <span className={`card-freshness-badge ${freshness.badgeClass}`}>
                                            {freshness.text}
                                        </span>
                                        {item.rating && (
                                            <span className="card-rating-badge">⭐ {item.rating}</span>
                                        )}
                                    </div>

                                    <div className="card-content-wrap">
                                        <div className="card-category-row">
                                            <span className="category-tag">{item.category}</span>
                                            {item.harvestMethod && (
                                                <span className="method-tag">🌿 {item.harvestMethod}</span>
                                            )}
                                        </div>

                                        <h3 className="produce-title" title={item.title}>
                                            {item.title}
                                        </h3>

                                        <div className="produce-pricing">
                                            <span className="price-amount">₹{item.price}</span>
                                            <span className="price-unit">/{item.unit}</span>
                                        </div>

                                        <div className="produce-meta">
                                            <div className="meta-row locality-row">
                                                <span>📍</span>
                                                <span className="locality-name" title={item.locationArea}>
                                                    {item.locationArea}
                                                </span>
                                            </div>
                                            {item.distanceKm !== null && item.distanceKm !== undefined && (
                                                <div className="meta-row distance-highlight">
                                                    <span>🚗</span>
                                                    <strong>{item.distanceKm} km away</strong>
                                                </div>
                                            )}
                                            <div className="meta-row stock-row">
                                                <span>📦</span>
                                                <span>{item.quantity} {item.unit} left</span>
                                            </div>
                                        </div>

                                        {/* Action: Blinkit / Zepto Style ADD & Quantity Stepper */}
                                        <div className="card-action-row" onClick={(e) => e.stopPropagation()}>
                                            {(() => {
                                                const loggedInEmail = (localStorage.getItem('loggedInEmail') || '').toLowerCase().trim();
                                                const isOwnItem = Boolean(
                                                    (loggedInEmail && item.seller?.email?.toLowerCase() === loggedInEmail) ||
                                                    (loggedInUser && item.seller?.name?.toLowerCase() === loggedInUser.toLowerCase())
                                                );

                                                if (isOwnItem) {
                                                    return (
                                                        <span className="badge-own-listing" title="You listed this produce">
                                                            🌿 Your Listing
                                                        </span>
                                                    );
                                                }

                                                if (itemQtyInCart === 0) {
                                                    return (
                                                        <button
                                                            className="btn-add-to-cart"
                                                            onClick={() => addToCart(item)}
                                                        >
                                                            + ADD
                                                        </button>
                                                    );
                                                }

                                                return (
                                                    <div className="card-qty-stepper">
                                                        <button
                                                            className="btn-card-step"
                                                            onClick={() => updateQuantity(item._id, -1)}
                                                        >
                                                            -
                                                        </button>
                                                        <span className="card-qty-count">{itemQtyInCart}</span>
                                                        <button
                                                            className="btn-card-step"
                                                            onClick={() => updateQuantity(item._id, 1)}
                                                            disabled={itemQtyInCart >= item.quantity}
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Empty State when no produce found */}
                {!loading && currentLocation && products.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-icon">🥦</div>
                        <h3>No produce found within {radiusKm} km</h3>
                        <p>
                            None of your neighbors have listed vegetables in this category yet.
                            Try expanding your search radius or list extra produce from your own garden!
                        </p>
                        <div className="empty-actions">
                            {radiusKm < 20 && (
                                <button className="btn-expand-radius" onClick={() => setRadiusKm(radiusKm === 5 ? 10 : 20)}>
                                    Expand to {radiusKm === 5 ? '10 km' : '20 km'}
                                </button>
                            )}
                            <Link to="/add-produce" className="btn-list-produce">
                                + List Your Produce
                            </Link>
                        </div>
                    </div>
                )}
            </main>

            {/* Desktop / Tablet Floating Cart Bar */}
            {totalItems > 0 && (
                <div className="floating-cart-bar" onClick={() => setIsCartOpen(true)}>
                    <div className="floating-cart-info">
                        <span className="floating-cart-badge">{totalItems} {totalItems === 1 ? 'item' : 'items'}</span>
                        <span className="floating-cart-total">₹{totalAmount}</span>
                    </div>
                    <button className="floating-cart-btn">
                        View Cart & Checkout →
                    </button>
                </div>
            )}

            {/* Mobile Bottom Navigation Bar (Blinkit & Zepto 1-Thumb Nav for < 768px) */}
            <nav className="mobile-bottom-nav">
                <Link to="/home" className={`bottom-nav-item ${location.pathname === '/home' ? 'active' : ''}`}>
                    <span className="bottom-nav-icon">🏠</span>
                    <span className="bottom-nav-label">Market</span>
                </Link>

                <Link to="/add-produce" className={`bottom-nav-item ${location.pathname === '/add-produce' ? 'active' : ''}`}>
                    <span className="bottom-nav-icon">🌱</span>
                    <span className="bottom-nav-label">Sell</span>
                </Link>

                <button
                    type="button"
                    className="bottom-nav-item"
                    onClick={() => {
                        if (!isLoggedIn) {
                            handleError('Please login to view your orders');
                            return;
                        }
                        setIsOrdersModalOpen(true);
                    }}
                >
                    <span className="bottom-nav-icon">🛍️</span>
                    <span className="bottom-nav-label">Orders</span>
                </button>

                <button
                    type="button"
                    className="bottom-nav-item"
                    onClick={() => {
                        if (!isLoggedIn) {
                            handleError('Please login to view your profile');
                            return;
                        }
                        setIsAccountModalOpen(true);
                    }}
                >
                    <span className="bottom-nav-icon">👤</span>
                    <span className="bottom-nav-label">Profile</span>
                </button>

                <button
                    className="bottom-nav-item cart-nav-item"
                    onClick={() => setIsCartOpen(true)}
                >
                    <div className="bottom-cart-icon-wrapper">
                        <span className="bottom-nav-icon">🛒</span>
                        {totalItems > 0 && (
                            <span className="bottom-cart-badge">{totalItems}</span>
                        )}
                    </div>
                    <span className="bottom-nav-label">
                        {totalItems > 0 ? `₹${totalAmount}` : 'Cart'}
                    </span>
                </button>
            </nav>

            {/* Slide-over Cart Drawer Component */}
            <CartDrawer />

            {/* Produce Details Modal (Full info, grower ratings, images, harvest story) */}
            {selectedProduct && (
                <ProductDetailsModal
                    product={selectedProduct}
                    onClose={() => setSelectedProduct(null)}
                />
            )}

            {/* Account Details Modal */}
            <AccountDetailsModal
                isOpen={isAccountModalOpen}
                onClose={() => setIsAccountModalOpen(false)}
                userName={loggedInUser}
                onOpenOrders={() => navigate('/orders')}
            />

            {/* User Orders Modal */}
            <MyOrdersModal
                isOpen={isOrdersModalOpen}
                onClose={() => setIsOrdersModalOpen(false)}
            />

            <ToastContainer />
        </div>
    );
}

export default Home;
