import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { API_URL, handleError, handleSuccess } from '../utils';
import { ToastContainer } from 'react-toastify';
import UserProfileMenu from '../components/UserProfileMenu';
import AccountDetailsModal from '../components/AccountDetailsModal';
import MyOrdersModal from '../components/MyOrdersModal';
import './Dashboard.css';

function Dashboard() {
    const navigate = useNavigate();
    const location = useLocation();

    // Check if URL specifies tab e.g. /dashboard?tab=purchases
    const searchParams = new URLSearchParams(location.search);
    const initialTab = searchParams.get('tab') || 'orders';

    const [activeTab, setActiveTab] = useState(initialTab); // 'orders', 'purchases', or 'listings'
    const [orders, setOrders] = useState([]);
    const [buyerOrders, setBuyerOrders] = useState([]);
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingOrderId, setUpdatingOrderId] = useState(null);

    // Profile modals
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);

    const loggedInUser = localStorage.getItem('loggedInUser') || 'Grower';

    // Fetch received orders, buyer purchases, and seller's active listings
    const fetchDashboardData = async (token) => {
        setLoading(true);
        try {
            // Safe JSON fetch helper
            const safeFetchJson = async (url) => {
                const res = await fetch(url, { headers: { Authorization: token } });
                const contentType = res.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    throw new Error(`Server returned HTTP ${res.status}`);
                }
                return res.json();
            };

            // 1. Fetch Orders received for this grower
            const ordersData = await safeFetchJson(`${API_URL}/orders/seller-orders`);
            if (ordersData.success) {
                setOrders(ordersData.orders || []);
            }

            // 2. Fetch Orders placed by this user as a buyer
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
            handleError(`Could not load dashboard data from ${API_URL}`);
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

    // Update Order Status (Received -> Packed -> Out for Delivery -> Completed)
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
                handleSuccess(`Order updated to: ${newStatus}`);
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

    // Delete a produce listing
    const handleDeleteListing = async (productId) => {
        if (!window.confirm('Are you sure you want to delete this vegetable listing?')) return;

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

    const pendingOrdersCount = orders.filter((ord) => ord.status !== 'Completed' && ord.status !== 'Cancelled').length;

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
                    <span className="dashboard-title">Dashboard & Account</span>
                </div>

                <div className="topbar-right">
                    <Link to="/home" className="btn-back-market">← Marketplace</Link>
                    <Link to="/add-produce" className="btn-add-produce">+ List Produce</Link>
                    <UserProfileMenu
                        userName={loggedInUser}
                        onLogout={handleLogout}
                        onOpenAccountDetails={() => setIsAccountModalOpen(true)}
                        onOpenOrders={() => setActiveTab('purchases')}
                    />
                </div>
            </div>

            <div className="dashboard-body">
                {/* Grower Greeting & Overview Stats */}
                <div className="dashboard-header-card">
                    <div>
                        <h2>Welcome, {loggedInUser}! 🌿</h2>
                        <p>Track neighbor orders for your produce, view incoming orders, your personal purchases, and inventory.</p>
                    </div>

                    <div className="stats-row">
                        <div className="stat-card">
                            <span className="stat-label">Total Earnings</span>
                            <span className="stat-value text-green">₹{totalEarnings}</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-label">Pending Orders</span>
                            <span className="stat-value text-orange">{pendingOrdersCount}</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-label">My Purchases</span>
                            <span className="stat-value text-blue">{buyerOrders.length}</span>
                        </div>
                    </div>
                </div>

                {/* Dashboard Tabs */}
                <div className="dashboard-tabs">
                    <button
                        className={`dash-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
                        onClick={() => setActiveTab('orders')}
                    >
                        📦 Customer Orders Received ({orders.length})
                    </button>
                    <button
                        className={`dash-tab-btn ${activeTab === 'purchases' ? 'active' : ''}`}
                        onClick={() => setActiveTab('purchases')}
                    >
                        🛍️ My Placed Orders ({buyerOrders.length})
                    </button>
                    <button
                        className={`dash-tab-btn ${activeTab === 'listings' ? 'active' : ''}`}
                        onClick={() => setActiveTab('listings')}
                    >
                        🌿 My Active Listings ({listings.length})
                    </button>
                </div>

                {loading ? (
                    <div className="dashboard-loading">
                        <div className="spinner"></div>
                        <p>Loading your dashboard details...</p>
                    </div>
                ) : (
                    <>
                        {/* TAB 1: CUSTOMER ORDERS (As Grower) */}
                        {activeTab === 'orders' && (
                            <div className="orders-tab-content">
                                {orders.length === 0 ? (
                                    <div className="dash-empty-box">
                                        <div className="empty-emoji">📬</div>
                                        <h3>No orders received yet</h3>
                                        <p>When nearby neighbors discover and order your surplus vegetables, their order details and delivery address will show up right here!</p>
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
                                                            {new Date(ord.createdAt).toLocaleDateString()} at{' '}
                                                            {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <span className={`status-badge-pill status-${ord.status.toLowerCase().replace(/\s+/g, '-')}`}>
                                                        {ord.status}
                                                    </span>
                                                </div>

                                                {/* Buyer Information Section */}
                                                <div className="buyer-info-box">
                                                    <h4 className="info-title">👤 Customer Delivery & Contact Details:</h4>
                                                    <div className="info-row">
                                                        <span>Customer Name:</span>
                                                        <strong>{ord.buyerName}</strong>
                                                    </div>
                                                    <div className="info-row">
                                                        <span>Phone Number:</span>
                                                        <a href={`tel:${ord.buyerPhone}`} className="phone-link">
                                                            📞 {ord.buyerPhone} (Click to Call)
                                                        </a>
                                                    </div>
                                                    <div className="info-row">
                                                        <span>Delivery Address:</span>
                                                        <span className="address-text">📍 {ord.buyerAddress}</span>
                                                    </div>
                                                    <div className="info-row">
                                                        <span>Payment Method:</span>
                                                        <span className="payment-tag">💵 {ord.paymentMethod}</span>
                                                    </div>
                                                </div>

                                                {/* Ordered Items Table */}
                                                <div className="order-items-table">
                                                    <h4 className="info-title">🥦 Produce Items Ordered:</h4>
                                                    {ord.items.map((it, idx) => (
                                                        <div key={idx} className="order-item-row">
                                                            <span>{it.title} ({it.quantity} {it.unit || 'kg'})</span>
                                                            <strong>₹{it.itemTotal}</strong>
                                                        </div>
                                                    ))}
                                                    <div className="order-total-row">
                                                        <span>Order Total:</span>
                                                        <span className="order-total-amount">₹{ord.totalAmount}</span>
                                                    </div>
                                                </div>

                                                {/* Status Selector Control */}
                                                <div className="status-control-section">
                                                    <label htmlFor={`status-${ord._id}`}>Update Status:</label>
                                                    <select
                                                        id={`status-${ord._id}`}
                                                        value={ord.status}
                                                        disabled={updatingOrderId === ord._id}
                                                        onChange={(e) => handleStatusChange(ord._id, e.target.value)}
                                                        className="status-select"
                                                    >
                                                        <option value="Received">🔵 Received</option>
                                                        <option value="Packed">📦 Packed & Ready</option>
                                                        <option value="Out for Delivery">🚚 Out for Delivery</option>
                                                        <option value="Completed">✅ Completed</option>
                                                        <option value="Cancelled">❌ Cancelled</option>
                                                    </select>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB 2: MY PURCHASES / PLACED ORDERS (As Buyer) */}
                        {activeTab === 'purchases' && (
                            <div className="orders-tab-content">
                                {buyerOrders.length === 0 ? (
                                    <div className="dash-empty-box">
                                        <div className="empty-emoji">🛒</div>
                                        <h3>No purchases placed yet</h3>
                                        <p>You haven't ordered any produce from nearby neighbors yet. Check out garden-fresh harvest within 5-10 km!</p>
                                        <Link to="/home" className="btn-primary-action">
                                            🌿 Explore Nearby Produce
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="orders-grid">
                                        {buyerOrders.map((ord) => (
                                            <div key={ord._id} className="order-card">
                                                <div className="order-card-header">
                                                    <div>
                                                        <span className="order-id">Purchase #{ord._id.slice(-6).toUpperCase()}</span>
                                                        <span className="order-time">
                                                            {new Date(ord.createdAt).toLocaleDateString()} at{' '}
                                                            {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <span className={`status-badge-pill status-${ord.status.toLowerCase().replace(/\s+/g, '-')}`}>
                                                        ● {ord.status}
                                                    </span>
                                                </div>

                                                <div className="buyer-info-box">
                                                    <h4 className="info-title">📍 Delivery & Grower Info:</h4>
                                                    <div className="info-row">
                                                        <span>Grower Name:</span>
                                                        <strong>{ord.seller?.name || 'Local Verified Neighbor'}</strong>
                                                    </div>
                                                    <div className="info-row">
                                                        <span>Deliver To:</span>
                                                        <span className="address-text">📍 {ord.buyerAddress}</span>
                                                    </div>
                                                    <div className="info-row">
                                                        <span>Payment Mode:</span>
                                                        <span className="payment-tag">💵 {ord.paymentMethod}</span>
                                                    </div>
                                                </div>

                                                <div className="order-items-table">
                                                    <h4 className="info-title">🥦 Items In This Order:</h4>
                                                    {ord.items.map((it, idx) => (
                                                        <div key={idx} className="order-item-row">
                                                            <span>{it.title} × {it.quantity} {it.unit || 'kg'}</span>
                                                            <strong>₹{it.itemTotal}</strong>
                                                        </div>
                                                    ))}
                                                    <div className="order-total-row">
                                                        <span>Total Paid:</span>
                                                        <span className="order-total-amount">₹{ord.totalAmount}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB 3: SELLER LISTINGS */}
                        {activeTab === 'listings' && (
                            <div className="listings-tab-content">
                                {listings.length === 0 ? (
                                    <div className="dash-empty-box">
                                        <div className="empty-emoji">🌱</div>
                                        <h3>No active listings found</h3>
                                        <p>You have not listed any surplus vegetables yet. Add your homegrown produce to let neighbors find it!</p>
                                        <Link to="/add-produce" className="btn-primary-action">
                                            + List Surplus Produce
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="listings-grid">
                                        {listings.map((prod) => (
                                            <div key={prod._id} className="listing-card">
                                                <div className="listing-header">
                                                    <span className="cat-badge">{prod.category}</span>
                                                    <span className={`avail-badge ${prod.isAvailable ? 'in-stock' : 'out-stock'}`}>
                                                        {prod.isAvailable ? '● Active' : '○ Out of stock'}
                                                    </span>
                                                </div>

                                                <h3>{prod.title}</h3>

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

                                                <button
                                                    className="btn-delete-listing"
                                                    onClick={() => handleDeleteListing(prod._id)}
                                                >
                                                    🗑️ Remove Listing
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Account Details Modal */}
            <AccountDetailsModal
                isOpen={isAccountModalOpen}
                onClose={() => setIsAccountModalOpen(false)}
                userName={loggedInUser}
                onOpenOrders={() => setActiveTab('purchases')}
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

export default Dashboard;
