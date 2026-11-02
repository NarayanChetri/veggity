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
    const [orderFilter, setOrderFilter] = useState('pending'); // 'pending' (to fulfill) | 'delivered' | 'all'
    const [isDeliveredExpanded, setIsDeliveredExpanded] = useState(true);
    const [listingFilter, setListingFilter] = useState('active'); // 'active' | 'expired' | 'all'
    const [reactivatingId, setReactivatingId] = useState(null);

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
                if (newStatus === 'Delivered') {
                    handleSuccess(`Order #${orderId.slice(-6).toUpperCase()} marked Delivered and moved to Delivered Orders! ✅`);
                } else {
                    handleSuccess(`Order status updated to: ${newStatus}`);
                }
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

    // Check if listing has expired
    const isExpired = (prod) => {
        if (!prod || !prod.expiresAt) return false;
        return new Date(prod.expiresAt) <= new Date();
    };

    // 1-Click Reactivate an expired produce listing
    const handleReactivateListing = async (prod) => {
        try {
            setReactivatingId(prod._id);
            const token = localStorage.getItem('token');
            const renewalDays = prod.shelfLifeDays || 5;

            const res = await fetch(`${API_URL}/orders/my-listings/${prod._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: token
                },
                body: JSON.stringify({
                    shelfLifeDays: renewalDays,
                    isAvailable: true
                })
            });

            const data = await res.json();
            if (data.success) {
                handleSuccess(`🎉 "${prod.title}" reactivated! Fresh for ${renewalDays} days.`);
                setListings((prev) =>
                    prev.map((p) => {
                        if (p._id === prod._id) {
                            return data.product || {
                                ...p,
                                expiresAt: new Date(Date.now() + renewalDays * 86400000),
                                isAvailable: true
                            };
                        }
                        return p;
                    })
                );
            } else {
                handleError(data.message || 'Failed to reactivate listing');
            }
        } catch (err) {
            console.error('Reactivation error:', err);
            handleError('Could not reactivate listing');
        } finally {
            setReactivatingId(null);
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

    // Separate active orders to fulfill from completed/delivered orders
    const isOrderDelivered = (ord) => {
        const s = (ord?.status || '').toLowerCase();
        return s.includes('deliver') || s.includes('complete');
    };

    const ordersToFulfill = orders.filter((ord) => !isOrderDelivered(ord) && ord.status !== 'Cancelled');
    const deliveredOrders = orders.filter((ord) => isOrderDelivered(ord));
    const pendingOrdersCount = ordersToFulfill.length;

    // Separate active and expired listings
    const activeListings = listings.filter((l) => !isExpired(l));
    const expiredListings = listings.filter((l) => isExpired(l));
    const displayedListings =
        listingFilter === 'active' ? activeListings :
        listingFilter === 'expired' ? expiredListings : listings;

    const activeListingsCount = activeListings.filter((l) => l.isAvailable).length;

    // Render an order card (active or delivered)
    const renderOrderCard = (ord, isDelivered = false) => (
        <div key={ord._id} className={`order-card ${isDelivered ? 'order-card-delivered' : ''}`}>
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
                <label>{isDelivered ? 'Fulfillment Status:' : 'Update Order Fulfillment Status:'}</label>
                <select
                    className={`status-select ${isDelivered ? 'status-select-delivered' : ''}`}
                    value={ord.status === 'Moved' ? 'Out for Delivery' : (ord.status || 'Packed')}
                    disabled={updatingOrderId === ord._id}
                    onChange={(e) => handleStatusChange(ord._id, e.target.value)}
                >
                    {ord.status === 'Order Placed' && (
                        <option value="Order Placed" disabled>📋 Order Placed (New)</option>
                    )}
                    <option value="Packed">📦 Packed</option>
                    <option value="Out for Delivery">🚚 Out for Delivery</option>
                    <option value="Delivered">✅ Delivered</option>
                </select>
            </div>
        </div>
    );

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
                        📦 Customer Orders to Fulfill ({ordersToFulfill.length})
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
                                    <>
                                        {/* Orders Filter Bar: Switch between pending, delivered, or all */}
                                        <div className="orders-filter-bar">
                                            <div className="orders-filter-pills">
                                                <button
                                                    type="button"
                                                    className={`filter-pill-btn ${orderFilter === 'pending' ? 'active' : ''}`}
                                                    onClick={() => setOrderFilter('pending')}
                                                >
                                                    ⏳ Orders to Fulfill
                                                    <span className="filter-badge-count">{ordersToFulfill.length}</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    className={`filter-pill-btn ${orderFilter === 'delivered' ? 'active' : ''}`}
                                                    onClick={() => setOrderFilter('delivered')}
                                                >
                                                    ✅ Delivered Orders
                                                    <span className="filter-badge-count">{deliveredOrders.length}</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    className={`filter-pill-btn ${orderFilter === 'all' ? 'active' : ''}`}
                                                    onClick={() => setOrderFilter('all')}
                                                >
                                                    All Orders
                                                    <span className="filter-badge-count">{orders.length}</span>
                                                </button>
                                            </div>
                                        </div>

                                        {/* VIEW 1: ORDERS TO FULFILL (PENDING ONLY) */}
                                        {orderFilter === 'pending' && (
                                            <div className="orders-view-section">
                                                <div className="orders-section-header">
                                                    <h3>⏳ Customer Orders to Fulfill ({ordersToFulfill.length})</h3>
                                                    <p>Active orders that need to be harvested, packed, or delivered.</p>
                                                </div>

                                                {ordersToFulfill.length === 0 ? (
                                                    <div className="dash-empty-box">
                                                        <div className="empty-emoji">🎉</div>
                                                        <h3>All Caught Up!</h3>
                                                        <p>You have no pending orders waiting to be packed or delivered right now.</p>
                                                        {deliveredOrders.length > 0 && (
                                                            <button
                                                                type="button"
                                                                className="btn-primary-action"
                                                                onClick={() => setOrderFilter('delivered')}
                                                            >
                                                                View Delivered Orders ({deliveredOrders.length})
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="orders-grid">
                                                        {ordersToFulfill.map((ord) => renderOrderCard(ord, false))}
                                                    </div>
                                                )}

                                                {/* Subsection for Delivered Orders below pending orders */}
                                                {deliveredOrders.length > 0 && (
                                                    <div className="delivered-orders-subsection">
                                                        <div
                                                            className="subsection-header-card"
                                                            onClick={() => setIsDeliveredExpanded(!isDeliveredExpanded)}
                                                        >
                                                            <div className="subsection-left">
                                                                <span className="delivered-section-icon">✅</span>
                                                                <div>
                                                                    <h4>Delivered Orders ({deliveredOrders.length})</h4>
                                                                    <p>Completed orders successfully harvested and delivered to buyers</p>
                                                                </div>
                                                            </div>
                                                            <button type="button" className="btn-toggle-subsection">
                                                                {isDeliveredExpanded ? 'Hide Delivered ▲' : `Show Delivered (${deliveredOrders.length}) ▼`}
                                                            </button>
                                                        </div>

                                                        {isDeliveredExpanded && (
                                                            <div className="orders-grid delivered-orders-grid">
                                                                {deliveredOrders.map((ord) => renderOrderCard(ord, true))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* VIEW 2: DELIVERED ORDERS ONLY */}
                                        {orderFilter === 'delivered' && (
                                            <div className="orders-view-section">
                                                <div className="orders-section-header">
                                                    <h3>✅ Delivered Orders ({deliveredOrders.length})</h3>
                                                    <p>Completed orders successfully fulfilled, delivered, and collected.</p>
                                                </div>

                                                {deliveredOrders.length === 0 ? (
                                                    <div className="dash-empty-box">
                                                        <div className="empty-emoji">🌱</div>
                                                        <h3>No delivered orders yet</h3>
                                                        <p>When you complete and mark active customer orders as "Delivered", they will appear right here.</p>
                                                        {ordersToFulfill.length > 0 && (
                                                            <button
                                                                type="button"
                                                                className="btn-primary-action"
                                                                onClick={() => setOrderFilter('pending')}
                                                            >
                                                                View Orders to Fulfill ({ordersToFulfill.length})
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="orders-grid delivered-orders-grid">
                                                        {deliveredOrders.map((ord) => renderOrderCard(ord, true))}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* VIEW 3: ALL ORDERS */}
                                        {orderFilter === 'all' && (
                                            <div className="orders-view-section">
                                                <div className="orders-section-header">
                                                    <h3>📋 All Customer Orders Received ({orders.length})</h3>
                                                    <p>Complete record of active and completed orders.</p>
                                                </div>

                                                <div className="orders-grid">
                                                    {orders.map((ord) => renderOrderCard(ord, isOrderDelivered(ord)))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {/* TAB 2: SELLER LISTINGS (MANAGE MY GARDEN LISTINGS) */}
                        {activeTab === 'listings' && (
                            <div className="listings-tab-content">
                                <div className="listings-action-bar">
                                    <div className="action-bar-text">
                                        <h3>Manage Your Surplus Garden Listings</h3>
                                        <p>Edit descriptions, update quantities, renew expired produce, or add fresh harvests.</p>
                                    </div>
                                    <Link to="/add-produce" className="btn-add-new-listing">
                                        + List More Garden Produce
                                    </Link>
                                </div>

                                {listings.length === 0 ? (
                                    <div className="dash-empty-box">
                                        <div className="empty-emoji">🌱</div>
                                        <h3>No produce listings yet</h3>
                                        <p>You haven't listed any surplus garden produce. List extra vegetables from your terrace or kitchen garden to sell to nearby neighbors!</p>
                                        <Link to="/add-produce" className="btn-primary-action">
                                            + List Your Produce
                                        </Link>
                                    </div>
                                ) : (
                                    <>
                                        {/* Filter Bar: Tabs & Dropdown for Active vs Expired */}
                                        <div className="listings-filter-bar">
                                            <div className="listings-filter-pills">
                                                <button
                                                    type="button"
                                                    className={`filter-pill-btn ${listingFilter === 'active' ? 'active' : ''}`}
                                                    onClick={() => setListingFilter('active')}
                                                >
                                                    🌿 Active Listings
                                                    <span className="filter-badge-count">{activeListings.length}</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    className={`filter-pill-btn ${listingFilter === 'expired' ? 'active' : ''}`}
                                                    onClick={() => setListingFilter('expired')}
                                                >
                                                    ⏰ Expired Listings
                                                    <span className="filter-badge-count">{expiredListings.length}</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    className={`filter-pill-btn ${listingFilter === 'all' ? 'active' : ''}`}
                                                    onClick={() => setListingFilter('all')}
                                                >
                                                    All
                                                    <span className="filter-badge-count">{listings.length}</span>
                                                </button>
                                            </div>

                                            <div className="listings-filter-dropdown-wrap">
                                                <label htmlFor="listing-filter-dropdown">View:</label>
                                                <select
                                                    id="listing-filter-dropdown"
                                                    className="listings-filter-select"
                                                    value={listingFilter}
                                                    onChange={(e) => setListingFilter(e.target.value)}
                                                >
                                                    <option value="active">Active Listings ({activeListings.length})</option>
                                                    <option value="expired">Expired Listings ({expiredListings.length})</option>
                                                    <option value="all">All Listings ({listings.length})</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Notice banner when on active tab and there are expired listings */}
                                        {listingFilter === 'active' && expiredListings.length > 0 && (
                                            <div className="expired-banner-notice">
                                                <span>
                                                    ⏰ You have <strong>{expiredListings.length} expired produce listing{expiredListings.length > 1 ? 's' : ''}</strong> hidden from nearby buyers.
                                                </span>
                                                <button
                                                    type="button"
                                                    className="btn-view-expired"
                                                    onClick={() => setListingFilter('expired')}
                                                >
                                                    Review & Reactivate ➔
                                                </button>
                                            </div>
                                        )}

                                        {displayedListings.length === 0 ? (
                                            <div className="dash-empty-box">
                                                <div className="empty-emoji">
                                                    {listingFilter === 'expired' ? '🎉' : '🥬'}
                                                </div>
                                                <h3>
                                                    {listingFilter === 'expired'
                                                        ? 'No expired listings!'
                                                        : 'No active produce listings'}
                                                </h3>
                                                <p>
                                                    {listingFilter === 'expired'
                                                        ? 'All your listed vegetables and fruits are currently fresh and within their shelf-life.'
                                                        : 'You currently have no active listings. Switch to the Expired Listings tab to reactivate them in 1 click, or list new harvests!'}
                                                </p>
                                                {listingFilter === 'active' && expiredListings.length > 0 && (
                                                    <button
                                                        type="button"
                                                        className="btn-primary-action"
                                                        onClick={() => setListingFilter('expired')}
                                                    >
                                                        View Expired Listings ({expiredListings.length})
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="listings-grid">
                                                {displayedListings.map((prod) => {
                                                    const expired = isExpired(prod);
                                                    return (
                                                        <div
                                                            key={prod._id}
                                                            className={`listing-card ${expired ? 'is-expired-card' : ''}`}
                                                        >
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
                                                                    {expired ? (
                                                                        <span className="avail-badge expired">⚠️ Expired</span>
                                                                    ) : (
                                                                        <span className={`avail-badge ${prod.isAvailable ? 'in-stock' : 'out-stock'}`}>
                                                                            {prod.isAvailable ? '● Active' : '○ Out of stock'}
                                                                        </span>
                                                                    )}
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
                                                            {expired && prod.expiresAt && (
                                                                <div className="listing-meta-row expired-date-row">
                                                                    <span>Expired On:</span>
                                                                    <strong className="expired-date-val">
                                                                        {new Date(prod.expiresAt).toLocaleDateString()}
                                                                    </strong>
                                                                </div>
                                                            )}
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
                                                                {expired ? (
                                                                    <button
                                                                        type="button"
                                                                        className="btn-reactivate-listing"
                                                                        disabled={reactivatingId === prod._id}
                                                                        onClick={() => handleReactivateListing(prod)}
                                                                        title="Reactivate this produce listing for 1 more fresh shelf-life cycle"
                                                                    >
                                                                        {reactivatingId === prod._id ? 'Reactivating...' : '⚡ Reactivate'}
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        type="button"
                                                                        className={`btn-toggle-stock ${prod.isAvailable ? 'btn-mark-out' : 'btn-mark-in'}`}
                                                                        onClick={() => handleToggleAvailability(prod._id)}
                                                                    >
                                                                        {prod.isAvailable ? 'Pause' : 'Activate'}
                                                                    </button>
                                                                )}
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
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </>
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
