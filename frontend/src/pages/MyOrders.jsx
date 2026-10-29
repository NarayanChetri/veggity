import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_URL, handleError, handleSuccess } from '../utils';
import { ToastContainer } from 'react-toastify';
import UserProfileMenu from '../components/UserProfileMenu';
import AccountDetailsModal from '../components/AccountDetailsModal';
import RateOrderModal from '../components/RateOrderModal';
import './MyOrders.css';

// Visual Tracking Steps Definition
const TRACKING_STEPS = [
    { key: 'placed', label: 'Order Placed', icon: '📋', desc: 'Received by grower' },
    { key: 'packed', label: 'Packed', icon: '📦', desc: 'Harvested & packed fresh' },
    { key: 'moved', label: 'Moved', icon: '🚚', desc: 'On the way to your area' },
    { key: 'arriving', label: 'Arriving', icon: '📍', desc: 'Arriving at your doorstep' },
    { key: 'delivered', label: 'Delivered', icon: '✅', desc: 'Delivered fresh' }
];

// Helper to determine active step index (1-based)
const getStepIndex = (status = '') => {
    const s = status.toLowerCase();
    if (s.includes('cancel')) return -1;
    if (s.includes('deliver') || s.includes('complete')) return 5;
    if (s.includes('arriv')) return 4;
    if (s.includes('mov') || s.includes('out') || s.includes('transit')) return 3;
    if (s.includes('pack')) return 2;
    return 1; // 'Order Placed' / 'Received'
};

function MyOrders() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [ratingOrder, setRatingOrder] = useState(null);

    const loggedInUser = localStorage.getItem('loggedInUser') || 'Neighbor';

    const fetchMyOrders = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            handleError('Please login to view your orders.');
            navigate('/login');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/orders/my-orders`, {
                headers: { Authorization: token }
            });
            const data = await res.json();
            if (data.success) {
                setOrders(data.orders || []);
            } else {
                handleError(data.message || 'Could not load your orders');
            }
        } catch (err) {
            console.error('Error fetching orders:', err);
            handleError('Failed to fetch your purchases from backend');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyOrders();
    }, []);

    const handleOrderRated = (updatedOrder) => {
        setOrders((prev) =>
            prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o))
        );
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('loggedInUser');
        localStorage.removeItem('loggedInEmail');
        handleSuccess('Logged out successfully');
        setTimeout(() => {
            navigate('/home');
        }, 800);
    };

    return (
        <div className="my-orders-page">
            {/* Top Bar Header */}
            <header className="orders-top-navbar">
                <div className="orders-navbar-inner">
                    <div className="orders-brand-group">
                        <Link to="/home" className="brand-logo-link">
                            <span className="brand-leaf">🌱</span>
                            <div className="brand-titles">
                                <span className="brand-name">Veggity</span>
                                <span className="brand-sub">Hyperlocal Produce</span>
                            </div>
                        </Link>
                    </div>

                    <div className="orders-nav-actions">
                        <Link to="/home" className="btn-nav-action-link">
                            ← Marketplace
                        </Link>
                        <Link to="/dashboard" className="btn-nav-action-grower">
                            📊 Grower Dashboard
                        </Link>
                        <UserProfileMenu
                            userName={loggedInUser}
                            onLogout={handleLogout}
                            onOpenAccountDetails={() => setIsAccountModalOpen(true)}
                            onOpenOrders={() => fetchMyOrders()}
                        />
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="orders-main-container">
                {/* Clear Guidance Mode Banner */}
                <div className="orders-portal-guide-banner">
                    <div className="guide-banner-text">
                        <span className="guide-icon">🛍️</span>
                        <div>
                            <strong>Viewing: Your Personal Purchases</strong>
                            <p>Here you can track vegetables you ordered from local gardens and rate delivered produce.</p>
                        </div>
                    </div>
                    <Link to="/dashboard" className="btn-switch-to-grower">
                        Switch to Grower Hub (Incoming Orders) →
                    </Link>
                </div>

                {/* Page Title & Status Header */}
                <div className="orders-page-header">
                    <div>
                        <h1>🛍️ My Produce Purchases</h1>
                        <p className="orders-page-subtitle">
                            Track live fulfillment, neighbor grower drop-offs, and rate your fresh garden vegetables.
                        </p>
                    </div>
                    <div className="orders-header-cta">
                        <Link to="/home" className="btn-shop-more">
                            + Order More Produce
                        </Link>
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="orders-loading-card">
                        <div className="orders-page-spinner" />
                        <p>Loading your fresh produce purchases...</p>
                    </div>
                )}

                {/* Empty State */}
                {!loading && orders.length === 0 && (
                    <div className="orders-empty-card">
                        <div className="empty-cart-emoji">🛒</div>
                        <h2>No purchases placed yet</h2>
                        <p>
                            You haven't bought any fresh surplus vegetables from local gardeners yet.
                            Explore freshly harvested produce in your neighborhood!
                        </p>
                        <Link to="/home" className="btn-explore-produce">
                            🌿 Browse Fresh Vegetables Near You
                        </Link>
                    </div>
                )}

                {/* Orders List */}
                {!loading && orders.length > 0 && (
                    <div className="orders-timeline-feed">
                        {orders.map((ord) => {
                            const stepIdx = getStepIndex(ord.status);
                            const isCancelled = stepIdx === -1;
                            const isDelivered = (ord.status || '').toLowerCase().includes('deliver') || (ord.status || '').toLowerCase().includes('complete');

                            return (
                                <div key={ord._id} className="order-tracking-card">
                                    {/* Order Meta Header */}
                                    <div className="order-card-topbar">
                                        <div className="order-id-group">
                                            <span className="order-id-badge">
                                                Purchase #{ord._id.slice(-6).toUpperCase()}
                                            </span>
                                            <span className="order-timestamp">
                                                📅 {new Date(ord.createdAt).toLocaleDateString(undefined, {
                                                    weekday: 'short',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })} at {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>

                                        <div className="order-status-badge-wrap">
                                            <span className={`status-pill status-${(ord.status || '').toLowerCase().replace(/\s+/g, '-')}`}>
                                                ● {ord.status || 'Order Placed'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* VISUAL ORDER STATUS TRACKER PIPELINE */}
                                    <div className="order-stepper-box">
                                        <h4 className="stepper-title">📍 Live Order Progress:</h4>

                                        {isCancelled ? (
                                            <div className="order-cancelled-notice">
                                                ⚠️ This order was cancelled.
                                            </div>
                                        ) : (
                                            <div className="stepper-container">
                                                <div className="stepper-track-bar">
                                                    <div
                                                        className="stepper-track-fill"
                                                        style={{
                                                            width: `${Math.max(0, (stepIdx - 1) / (TRACKING_STEPS.length - 1)) * 100}%`
                                                        }}
                                                    />
                                                </div>

                                                <div className="stepper-milestones">
                                                    {TRACKING_STEPS.map((step, idx) => {
                                                        const currentNumber = idx + 1;
                                                        const isDone = currentNumber < stepIdx;
                                                        const isCurrent = currentNumber === stepIdx;
                                                        const isPending = currentNumber > stepIdx;

                                                        return (
                                                            <div
                                                                key={step.key}
                                                                className={`stepper-node ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''} ${isPending ? 'pending' : ''}`}
                                                            >
                                                                <div className="node-circle">
                                                                    {isDone ? '✓' : step.icon}
                                                                </div>
                                                                <div className="node-content">
                                                                    <span className="node-label">{step.label}</span>
                                                                    <span className="node-desc">{step.desc}</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Order Items List */}
                                    <div className="order-items-container">
                                        <h4 className="items-header-title">🥦 Items In This Order:</h4>
                                        <div className="items-grid-list">
                                            {ord.items.map((it, idx) => {
                                                const itemImg = it.imageUrl || it.product?.imageUrl || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300&auto=format&fit=crop&q=80';

                                                return (
                                                    <div key={idx} className="order-item-tile">
                                                        <img
                                                            src={itemImg}
                                                            alt={it.title}
                                                            className="item-tile-thumb"
                                                            onError={(e) => {
                                                                e.target.src = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300&auto=format&fit=crop&q=80';
                                                            }}
                                                        />
                                                        <div className="item-tile-info">
                                                            <h5 className="item-tile-title">{it.title}</h5>
                                                            <span className="item-tile-qty">
                                                                {it.quantity} {it.unit || 'kg'} × ₹{it.price}
                                                            </span>
                                                        </div>
                                                        <div className="item-tile-total">
                                                            <strong>₹{it.itemTotal}</strong>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Order Footer Info (Grower & Delivery) */}
                                    <div className="order-card-bottom-summary">
                                        <div className="order-meta-info-block">
                                            <div className="meta-info-row">
                                                <span className="meta-label">🌱 Local Grower:</span>
                                                <strong className="meta-value">
                                                    {ord.seller?.name || 'Local Verified Neighbor'}
                                                </strong>
                                            </div>
                                            {ord.seller?.email && (
                                                <div className="meta-info-row">
                                                    <span className="meta-label">✉️ Grower Contact:</span>
                                                    <span className="meta-value">{ord.seller.email}</span>
                                                </div>
                                            )}
                                            <div className="meta-info-row">
                                                <span className="meta-label">📍 Deliver To:</span>
                                                <span className="meta-value address-highlight">
                                                    {ord.deliveryAddress} {ord.buyerLocality ? `(${ord.buyerLocality})` : ''}
                                                </span>
                                            </div>
                                            <div className="meta-info-row">
                                                <span className="meta-label">💳 Payment Method:</span>
                                                <span className="meta-payment-badge">
                                                    {ord.paymentMethod}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="order-grand-total-box">
                                            <span className="grand-total-label">Total Amount</span>
                                            <span className="grand-total-price">₹{ord.totalAmount}</span>
                                        </div>
                                    </div>

                                    {/* Rating Section (Visible once Delivered) */}
                                    {isDelivered && (
                                        <div className="order-rating-card-footer">
                                            {ord.isRated ? (
                                                <div className="rated-summary-badge">
                                                    <span className="rated-stars">
                                                        {'★'.repeat(ord.rating?.score || 5)}
                                                    </span>
                                                    <span className="rated-score-label">
                                                        You rated this harvest {ord.rating?.score || 5}/5 Stars
                                                    </span>
                                                    {ord.rating?.review && (
                                                        <p className="rated-review-quote">
                                                            "{ord.rating.review}"
                                                        </p>
                                                    )}
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="btn-rate-order-action"
                                                    onClick={() => setRatingOrder(ord)}
                                                >
                                                    ⭐ Rate This Fresh Produce & Grower
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Rate Order Modal */}
            <RateOrderModal
                isOpen={Boolean(ratingOrder)}
                order={ratingOrder}
                onClose={() => setRatingOrder(null)}
                onRated={handleOrderRated}
            />

            {/* Account Details Modal */}
            <AccountDetailsModal
                isOpen={isAccountModalOpen}
                onClose={() => setIsAccountModalOpen(false)}
            />

            <ToastContainer />
        </div>
    );
}

export default MyOrders;
