import React, { useState, useEffect } from 'react';
import { API_URL, handleError } from '../utils';
import './MyOrdersModal.css';

function MyOrdersModal({ isOpen, onClose }) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isOpen) return;

        const token = localStorage.getItem('token');
        if (!token) {
            setLoading(false);
            return;
        }

        setLoading(true);
        fetch(`${API_URL}/orders/my-orders`, {
            headers: { Authorization: token }
        })
            .then(async (res) => {
                const contentType = res.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    throw new Error(`Server returned HTTP ${res.status}`);
                }
                return res.json();
            })
            .then((data) => {
                if (data.success) {
                    setOrders(data.orders || []);
                } else {
                    handleError(data.message || 'Failed to load your orders');
                }
            })
            .catch((err) => {
                console.error(err);
                handleError(`Could not load orders: ${err.message}`);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="orders-modal-backdrop" onClick={onClose}>
            <div className="orders-modal-card" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="orders-modal-header">
                    <div>
                        <h3>🛍️ My Produce Orders</h3>
                        <p>Track your neighborhood garden purchases and delivery status</p>
                    </div>
                    <button className="btn-close-orders-modal" onClick={onClose}>✕</button>
                </div>

                {/* Body Content */}
                <div className="orders-modal-body">
                    {loading && (
                        <div className="orders-loading-state">
                            <div className="orders-spinner" />
                            <p>Loading your orders...</p>
                        </div>
                    )}

                    {!loading && orders.length === 0 && (
                        <div className="orders-empty-state">
                            <span className="empty-cart-icon">🛒</span>
                            <h4>No Orders Placed Yet</h4>
                            <p>You haven't ordered any vegetables from nearby neighbors yet. Explore fresh harvest on the marketplace!</p>
                            <button className="btn-shop-now" onClick={onClose}>
                                🌿 Browse Garden Produce
                            </button>
                        </div>
                    )}

                    {!loading && orders.length > 0 && (
                        <div className="orders-list">
                            {orders.map((ord) => (
                                <div key={ord._id} className="user-order-card">
                                    <div className="user-order-header">
                                        <div>
                                            <span className="user-order-id">
                                                Order #{ord._id.slice(-6).toUpperCase()}
                                            </span>
                                            <span className="user-order-date">
                                                {new Date(ord.createdAt).toLocaleDateString()} at{' '}
                                                {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <span className={`order-status-tag status-${ord.status.toLowerCase().replace(/\s+/g, '-')}`}>
                                            ● {ord.status}
                                        </span>
                                    </div>

                                    {/* Items List */}
                                    <div className="user-order-items">
                                        {ord.items.map((it, idx) => (
                                            <div key={idx} className="user-order-item-row">
                                                <div className="item-name-qty">
                                                    <strong>{it.title}</strong>
                                                    <span>× {it.quantity} {it.unit || 'kg'}</span>
                                                </div>
                                                <span className="item-subtotal">₹{it.itemTotal}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Total and Grower info */}
                                    <div className="user-order-footer">
                                        <div className="order-delivery-brief">
                                            <span>📍 Deliver to: <strong>{ord.buyerAddress}</strong></span>
                                            {ord.seller?.name && (
                                                <span className="order-grower-name">
                                                    🌱 Grower: <strong>{ord.seller.name}</strong>
                                                </span>
                                            )}
                                        </div>
                                        <div className="order-grand-total">
                                            <span className="total-label">Total Paid:</span>
                                            <strong className="total-amount">₹{ord.totalAmount}</strong>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="orders-modal-footer">
                    <button type="button" className="btn-orders-close" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

export default MyOrdersModal;

