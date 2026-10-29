import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { API_URL, handleError, handleSuccess } from '../utils';
import { ToastContainer } from 'react-toastify';
import UserProfileMenu from '../components/UserProfileMenu';
import AccountDetailsModal from '../components/AccountDetailsModal';
import EditListingModal from '../components/EditListingModal';
import './Dashboard.css';

function Dashboard() {
    const navigate = useNavigate();
    const location = useLocation();

    // Parse tab from URL or session storage
    const searchParams = new URLSearchParams(location.search);
    const sessionTab = sessionStorage.getItem('dashboard_active_tab');
    if (sessionTab) {
        sessionStorage.removeItem('dashboard_active_tab');
    }
    const initialTab = searchParams.get('tab') || sessionTab || 'orders';

    // If user asked for purchases/my-orders, route them to the dedicated My Purchases page
    useEffect(() => {
        const tabParam = new URLSearchParams(location.search).get('tab');
        if (tabParam === 'purchases' || tabParam === 'my-orders') {
            navigate('/orders', { replace: true });
        }
    }, [location.search, navigate]);

    const [activeTab, setActiveTab] = useState(
        initialTab === 'listings' ? 'listings' : 'orders'
    ); // 'orders' (customer orders to fulfill) or 'listings' (manage produce)
    const [orders, setOrders] = useState([]);
    const [buyerOrders, setBuyerOrders] = useState([]);
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingOrderId, setUpdatingOrderId] = useState(null);

    // Profile & Edit modals
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    const loggedInUser = localStorage.getItem('loggedInUser') || 'Grower';

    // Synchronize activeTab if query params change in URL
    useEffect(() => {
        const tabParam = new URLSearchParams(location.search).get('tab');
        if (tabParam === 'listings') {
            setActiveTab('listings');
        } else if (tabParam === 'orders') {
            setActiveTab('orders');
        }
    }, [location.search]);

    // Fetch received orders, buyer purchases, and seller listings
    const fetchDashboardData = async (token) => {
        setLoading(true);
        try {
            const safeFetchJson = async (url) => {
                const res = await fetch(url, { headers: { Authorization: token } });
                const contentType = res.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    throw new Error(`Server returned HTTP ${res.status}`);
                }
                return res.json();
            };

            // 1. Fetch Orders received for this grower to fulfill
            const ordersData = await safeFetchJson(`${API_URL}/orders/seller-orders`);
            if (ordersData.success) {
                setOrders(ordersData.orders || []);
            }

            // 2. Fetch Orders placed by this user as a buyer (for stats count & switcher banner)
            const buyerOrdersData = await safeFetchJson(`${API_URL}/orders/my-orders`);
            if (buyerOrdersData.success) {
                setBuyerOrders(buyerOrdersData.orders || []);
            }

            // 3. Fetch produce listings created by this grower
            const listingsData = await safeFetchJson(`${API_URL}/orders/my-listings`);
            if (listingsData.success) {
                setListings(listingsData.listings || []);
            }
        } catch (err) {
            console.error('Dashboard data fetch error:', err);
            handleError(`Could not load dashboard data: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Verify authentication
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            handleError('Please login to access your Grower Dashboard');
            navigate('/login');
            return;
        }

        fetchDashboardData(token);
    }, [navigate]);

    // Update Order Status (Seller fulfilling order)
    const handleStatusChange = async (orderId, newStatus) => {
        setUpdatingOrderId(orderId);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: token
                },
                body: JSON.stringify({ status: newStatus })
            });

            const data = await res.json();
            if (data.success) {
                handleSuccess(`Order status updated to: ${newStatus}`);
                setOrders((prev) =>
                    prev.map((ord) => (ord._id === orderId ? { ...ord, status: newStatus } : ord))
                );
            } else {
                handleError(data.message || 'Failed to update order status');
            }
        } catch (err) {
            console.error('Status update error:', err);
            handleError('Could not update status');
        } finally {
            setUpdatingOrderId(null);
        }
    };

    // Toggle Produce Listing Availability (In Stock / Out of Stock)
    const handleToggleAvailability = async (productId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/orders/my-listings/${productId}/toggle`, {
                method: 'PATCH',
                headers: { Authorization: token }
            });

            const data = await res.json();
            if (data.success) {
                handleSuccess(data.message || 'Availability updated');
                setListings((prev) =>
                    prev.map((p) => (p._id === productId ? { ...p, isAvailable: data.isAvailable } : p))
                );
            } else {
                handleError(data.message || 'Failed to toggle availability');
            }
        } catch (err) {
            console.error('Toggle error:', err);
            handleError('Could not update produce availability');
        }
    };

    // Delete a produce listing
    const handleDeleteListing = async (productId) => {
        if (!window.confirm('Are you sure you want to permanently delete this vegetable listing?')) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/orders/my-listings/${productId}`, {
                method: 'DELETE',
                headers: { Authorization: token }
            });

            const data = await res.json();
            if (data.success) {
                handleSuccess('Listing removed successfully');
                setListings((prev) => prev.filter((p) => p._id !== productId));
            } else {
                handleError(data.message || 'Failed to delete listing');
            }
        } catch (err) {
            console.error('Delete error:', err);
            handleError('Could not delete produce listing');
        }
    };

    // Update listing callback from EditListingModal
    const handleListingUpdated = (updatedProduct) => {
        setListings((prev) =>
            prev.map((p) => (p._id === updatedProduct._id ? updatedProduct : p))
        );
    };

    // Logout handler
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('loggedInUser');
        localStorage.removeItem('loggedInEmail');
        handleSuccess('Logged out successfully');
        setTimeout(() => {
            navigate('/home');
        }, 800);
    };

    // Aggregate statistics
    const totalEarnings = orders
        .filter((ord) => ord.status !== 'Cancelled')
        .reduce((sum, ord) => sum + (ord.totalAmount || 0), 0);

    const pendingOrdersCount = orders.filter((ord) => {
        const s = (ord.status || '').toLowerCase();
        return !s.includes('deliver') && !s.includes('complete') && !s.includes('cancel');
    }).length;

    const activeListingsCount = listings.filter((l) => l.isAvailable).length;

    return (
        <div className="dashboard-container">
            {/* Top Bar */}
            <div className="dashboard-topbar">
                <div className="topbar-left">
                    <Link to="/home" className="dashboard-brand">
                        <span>🌱</span>
                        <strong>Veggity</strong>
                    </Link>
                    <span className="brand-divider">/</span>
                    <span className="dashboard-title">Grower Management Center</span>
                </div>

                <div className="topbar-right">
                    <Link
                        to="/orders"
                        className="btn-nav-buyer-orders"
                        title="View vegetables you bought as a customer"
                    >
                        🛍️ My Purchases ({buyerOrders.length})
                    </Link>
                    <Link to="/home" className="btn-back-market">← Marketplace</Link>
                    <Link to="/add-produce" className="btn-add-produce">+ List Surplus</Link>
                    <UserProfileMenu
                        userName={loggedInUser}
                        onLogout={handleLogout}
                        onOpenAccountDetails={() => setIsAccountModalOpen(true)}
                        onOpenOrders={() => navigate('/orders')}
                    />
                </div>
            </div>

            <div className="dashboard-body">
                {/* Clear Guidance Switcher Banner */}
                <div className="buyer-portal-banner">
                    <div className="portal-banner-icon">🛍️</div>
                    <div className="portal-banner-content">
                        <strong>Looking for vegetables you bought as a customer?</strong>
                        <span>Your personal purchases, 5-step live delivery tracking, and produce ratings are in your dedicated Purchases section.</span>
                    </div>
                    <Link to="/orders" className="btn-portal-banner">
                        View My Purchases ({buyerOrders.length}) →
                    </Link>
                </div>

                {/* Greeting & Overview Stats */}
                <div className="dashboard-header-card">
                    <div>
                        <h2>Grower Hub: Welcome, {loggedInUser}! 🌿</h2>
                        <p>Fulfill incoming customer orders for your garden harvest and manage your produce inventory.</p>
                    </div>

                    <div className="stats-row">
                        <div className="stat-card">
                            <span className="stat-label">Total Earnings</span>
                            <span className="stat-value text-green">₹{totalEarnings}</span>
                        </div>
                        <div
                            className={`stat-card clickable-stat ${activeTab === 'orders' ? 'active-stat-card' : ''}`}
                            onClick={() => setActiveTab('orders')}
                            title="Click to view Customer Orders Received"
                        >
                            <span className="stat-label">Orders to Fulfill</span>
                            <span className="stat-value text-orange">{pendingOrdersCount}</span>
                        </div>
                        <div
                            className={`stat-card clickable-stat ${activeTab === 'listings' ? 'active-stat-card' : ''}`}
                            onClick={() => setActiveTab('listings')}
                            title="Click to view Garden Listings"
                        >
                            <span className="stat-label">Active Listings</span>
                            <span className="stat-value text-green">{activeListingsCount}</span>
                        </div>
                        <Link
                            to="/orders"
                            className="stat-card stat-card-link"
                            title="Click to open your personal Purchases tracker"
                        >
                            <span className="stat-label">My Purchases</span>
                            <span className="stat-value text-blue">{buyerOrders.length}</span>
                        </Link>
                    </div>
                </div>

                {/* Dedicated 2-Tab Grower Navigation */}
                <div className="dashboard-tabs">
                    <button
                        className={`dash-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
                        onClick={() => setActiveTab('orders')}
                    >
                        📦 Customer Orders to Fulfill ({orders.length})
                    </button>
                    <button
                        className={`dash-tab-btn ${activeTab === 'listings' ? 'active' : ''}`}
                        onClick={() => setActiveTab('listings')}
                    >
                        🌾 Manage My Garden Listings ({listings.length})
                    </button>
                </div>

                {loading ? (
                    <div className="dashboard-loading">
                        <div className="spinner"></div>
                        <p>Loading your grower dashboard...</p>
                    </div>
                ) : (
                    <>
                        {/* TAB 1: CUSTOMER ORDERS RECEIVED (FOR GROWERS FULFILLING ORDERS) */}
                        {activeTab === 'orders' && (
                            <div className="orders-tab-content">
                                {orders.length === 0 ? (
                                    <div className="dash-empty-box">
                                        <div className="empty-emoji">📬</div>
                                        <h3>No customer orders received yet</h3>
                                        <p>When nearby neighbors discover and order your surplus vegetables from the marketplace, their order details and delivery address will show up right here!</p>
                                        <Link to="/add-produce" className="btn-primary-action">
                                            + List More Garden Produce
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="orders-grid">
                                        {orders.map((ord) => (
                                            <div key={ord._id} className="order-card">
                                                {/* Header with status */}
                                                <div className="order-card-header">
                                                    <div>
                                                        <span className="order-id">Order #{ord._id.slice(-6).toUpperCase()}</span>
                                                        <span className="order-time">
                                                            📅 {new Date(ord.createdAt).toLocaleDateString()} at{' '}
                                                            {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <span className={`status-badge-pill status-${(ord.status || '').toLowerCase().replace(/\s+/g, '-')}`}>
                                                        ● {ord.status || 'Order Placed'}
                                                    </span>
                                                </div>

                                                {/* Buyer Information Section */}
                                                <div className="buyer-info-box">
                                                    <h4 className="info-title">👤 Customer Delivery & Contact:</h4>
                                                    <div className="info-row">
                                                        <span>Customer:</span>
                                                        <strong>{ord.buyerName}</strong>
                                                    </div>
                                                    <div className="info-row">
                                                        <span>Phone:</span>
                                                        <a href={`tel:${ord.buyerPhone}`} className="phone-link">
                                                            📞 {ord.buyerPhone}
                                                        </a>
                                                    </div>
                                                    <div className="info-row">
                                                        <span>Delivery Address:</span>
                                                        <span className="address-text">{ord.deliveryAddress}</span>
                                                    </div>
                                                    <div className="info-row">
                                                        <span>Payment Mode:</span>
                                                        <span className="payment-tag">💵 Cash on Delivery (COD)</span>
                                                    </div>
                                                </div>

                                                {/* Items Table */}
                                                <div className="order-items-table">
                                                    <h4 className="info-title">🥬 Harvest Ordered:</h4>
                                                    {ord.items.map((it, idx) => (
                                                        <div key={idx} className="order-item-row">
                                                            <div className="item-with-thumb">
                                                                <img
                                                                    src={it.product?.imageUrl || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=100&auto=format&fit=crop&q=80'}
                                                                    alt={it.title}
                                                                    className="order-row-thumb"
                                                                    onError={(e) => {
                                                                        e.target.src = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=100&auto=format&fit=crop&q=80';
                                                                    }}
                                                                />
                                                                <span>{it.title} ({it.quantity} {it.unit || 'kg'})</span>
                                                            </div>
                                                            <strong>₹{it.price * it.quantity}</strong>
                                                        </div>
                                                    ))}
                                                    <div className="order-total-row">
                                                        <span>Total to Collect:</span>
                                                        <span className="order-total-amount">₹{ord.totalAmount}</span>
                                                    </div>
                                                </div>

                                                {/* Status Updater Dropdown */}
                                                <div className="status-control-section">
                                                    <label>Update Order Fulfillment Status:</label>
                                                    <select
                                                        className="status-select"
                                                        value={ord.status || 'Order Placed'}
                                                        disabled={updatingOrderId === ord._id}
                                                        onChange={(e) => handleStatusChange(ord._id, e.target.value)}
                                                    >
                                                        <option value="Order Placed">📋 1. Order Placed</option>
                                                        <option value="Packed">📦 2. Harvested & Packed</option>
                                                        <option value="Moved">🚚 3. Out for Delivery</option>
                                                        <option value="Arriving">📍 4. Arriving Soon</option>
                                                        <option value="Delivered">✅ 5. Delivered & Paid</option>
                                                        <option value="Cancelled">❌ Cancelled</option>
                                                    </select>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB 2: SELLER LISTINGS (MANAGE MY GARDEN LISTINGS) */}
                        {activeTab === 'listings' && (
                            <div className="listings-tab-content">
                                <div className="listings-action-bar">
                                    <div className="action-bar-text">
                                        <h3>Manage Your Surplus Garden Listings</h3>
                                        <p>Edit descriptions, update quantities, pause stock, or add new homegrown vegetables.</p>
                                    </div>
                                    <Link to="/add-produce" className="btn-add-new-listing">
                                        + List More Garden Produce
                                    </Link>
                                </div>

                                {listings.length === 0 ? (
                                    <div className="dash-empty-box">
                                        <div className="empty-emoji">🌱</div>
                                        <h3>No active produce listings yet</h3>
                                        <p>You haven't listed any surplus garden produce. List extra vegetables from your terrace or kitchen garden to sell to nearby neighbors!</p>
                                        <Link to="/add-produce" className="btn-primary-action">
                                            + List Your Produce
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="listings-grid">
                                        {listings.map((prod) => (
                                            <div key={prod._id} className="listing-card">
                                                {/* Produce Image with Category and Stock Badges */}
                                                <div className="listing-card-media">
                                                    <img
                                                        src={prod.imageUrl || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&auto=format&fit=crop&q=80'}
                                                        alt={prod.title}
                                                        className="listing-thumb-img"
                                                        loading="lazy"
                                                        onError={(e) => {
                                                            e.target.src = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&auto=format&fit=crop&q=80';
                                                        }}
                                                    />
                                                    <div className="listing-media-badges">
                                                        <span className="cat-badge">{prod.category}</span>
                                                        <span className={`avail-badge ${prod.isAvailable ? 'in-stock' : 'out-stock'}`}>
                                                            {prod.isAvailable ? '● Active' : '○ Out of stock'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Title */}
                                                <h3 className="listing-card-title">{prod.title}</h3>

                                                {/* Description */}
                                                {prod.description ? (
                                                    <p className="listing-desc-text">"{prod.description}"</p>
                                                ) : (
                                                    <p className="listing-desc-text empty-desc">No description added yet. Click edit to add your garden story!</p>
                                                )}

                                                {/* Key Produce Metadata */}
                                                <div className="listing-meta-row">
                                                    <span>Price:</span>
                                                    <strong>₹{prod.price} / {prod.unit}</strong>
                                                </div>
                                                <div className="listing-meta-row">
                                                    <span>Stock Remaining:</span>
                                                    <strong>{prod.quantity} {prod.unit}</strong>
                                                </div>
                                                <div className="listing-meta-row">
                                                    <span>Location:</span>
                                                    <span>{prod.locationArea}</span>
                                                </div>
                                                <div className="listing-meta-row">
                                                    <span>Fresh Shelf-Life:</span>
                                                    <span>{prod.shelfLifeDays} Days</span>
                                                </div>
                                                {prod.harvestMethod && (
                                                    <div className="listing-meta-row">
                                                        <span>Harvest:</span>
                                                        <span className="harvest-badge">{prod.harvestMethod}</span>
                                                    </div>
                                                )}

                                                {/* Manage Listing Controls */}
                                                <div className="listing-actions-row">
                                                    <button
                                                        type="button"
                                                        className="btn-edit-listing"
                                                        onClick={() => setEditingProduct(prod)}
                                                        title="Edit description, price, stock, and photos"
                                                    >
                                                        ✏️ Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className={`btn-toggle-stock ${prod.isAvailable ? 'btn-mark-out' : 'btn-mark-in'}`}
                                                        onClick={() => handleToggleAvailability(prod._id)}
                                                    >
                                                        {prod.isAvailable ? 'Pause' : 'Activate'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn-delete-listing"
                                                        onClick={() => handleDeleteListing(prod._id)}
                                                        title="Delete Produce"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Edit Produce Modal */}
            <EditListingModal
                isOpen={Boolean(editingProduct)}
                product={editingProduct}
                onClose={() => setEditingProduct(null)}
                onUpdated={handleListingUpdated}
            />

            {/* Account Details Modal */}
            <AccountDetailsModal
                isOpen={isAccountModalOpen}
                onClose={() => setIsAccountModalOpen(false)}
                userName={loggedInUser}
                onOpenOrders={() => navigate('/orders')}
            />

            <ToastContainer />
        </div>
    );
}

export default Dashboard;
