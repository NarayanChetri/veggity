import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { API_URL, handleError, handleSuccess } from '../utils';
import './CartDrawer.css';

function CartDrawer() {
    const navigate = useNavigate();
    const {
        cartItems,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalItems,
        totalAmount,
        isCartOpen,
        setIsCartOpen
    } = useCart();

    const [buyerName, setBuyerName] = useState('');
    const [buyerPhone, setBuyerPhone] = useState('');
    const [buyerAddress, setBuyerAddress] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditingAddress, setIsEditingAddress] = useState(false);

    // Pre-populate name, phone & address from localStorage
    useEffect(() => {
        if (!isCartOpen) return;

        const savedUser = localStorage.getItem('veggity_saved_name') || localStorage.getItem('loggedInUser') || '';
        const savedPhone = localStorage.getItem('veggity_saved_phone') || '';
        let savedAddress = localStorage.getItem('veggity_saved_address') || '';

        if (!savedAddress) {
            try {
                const savedLoc = localStorage.getItem('veggity_location');
                if (savedLoc) {
                    const parsed = JSON.parse(savedLoc);
                    savedAddress = parsed.name + (parsed.subtitle ? `, ${parsed.subtitle}` : '');
                }
            } catch (_e) {}
        }

        setBuyerName(savedUser);
        setBuyerPhone(savedPhone);
        setBuyerAddress(savedAddress);

        // If user already has a saved phone and address, show summary with edit button
        if (savedPhone && savedAddress) {
            setIsEditingAddress(false);
        } else {
            setIsEditingAddress(true);
        }
    }, [isCartOpen]);

    if (!isCartOpen) return null;

    const handleSaveAddressDetails = (e) => {
        if (e) e.preventDefault();
        if (!buyerName.trim()) {
            return handleError('Please enter your full name');
        }
        if (!buyerPhone.trim() || buyerPhone.trim().length < 10) {
            return handleError('Please enter a valid 10-digit phone number');
        }
        if (!buyerAddress.trim()) {
            return handleError('Please enter your delivery address');
        }

        // Persist to localStorage
        localStorage.setItem('veggity_saved_name', buyerName.trim());
        localStorage.setItem('veggity_saved_phone', buyerPhone.trim());
        localStorage.setItem('veggity_saved_address', buyerAddress.trim());
        setIsEditingAddress(false);
        handleSuccess('Delivery address and contact saved!');
    };

    const handleCheckout = async (e) => {
        e.preventDefault();

        const token = localStorage.getItem('token');
        if (!token) {
            handleError('Please login to place an order');
            setIsCartOpen(false);
            navigate('/login');
            return;
        }

        if (!buyerName.trim()) {
            setIsEditingAddress(true);
            return handleError('Please enter your full name');
        }
        if (!buyerPhone.trim() || buyerPhone.trim().length < 10) {
            setIsEditingAddress(true);
            return handleError('Please enter a valid 10-digit phone number');
        }
        if (!buyerAddress.trim()) {
            setIsEditingAddress(true);
            return handleError('Please enter your house/society address for delivery/pickup');
        }

        // Always save delivery and contact information for effortless future orders
        localStorage.setItem('veggity_saved_name', buyerName.trim());
        localStorage.setItem('veggity_saved_phone', buyerPhone.trim());
        localStorage.setItem('veggity_saved_address', buyerAddress.trim());

        setIsSubmitting(true);

        try {
            const orderPayload = {
                buyerName: buyerName.trim(),
                buyerPhone: buyerPhone.trim(),
                buyerAddress: buyerAddress.trim(),
                paymentMethod,
                items: cartItems.map((it) => ({
                    _id: it._id,
                    product: it._id,
                    title: it.title,
                    category: it.category,
                    price: it.price,
                    unit: it.unit,
                    quantity: it.quantity,
                    seller: it.seller?._id || it.seller
                }))
            };

            const response = await fetch(`${API_URL}/orders/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify(orderPayload)
            });

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                return handleError(`Backend at ${API_URL} returned ${response.status}. Please check backend connection.`);
            }

            const data = await response.json();

            if (data.success) {
                handleSuccess('🎉 Order placed successfully! Directing you to your purchases tracker...');
                clearCart();
                setIsCartOpen(false);
                setTimeout(() => {
                    navigate('/orders');
                }, 600);
            } else {
                handleError(data.message || 'Failed to place order');
            }
        } catch (err) {
            console.error('Checkout error:', err);
            handleError('Could not connect to server to place order');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="cart-backdrop" onClick={() => setIsCartOpen(false)}>
            <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="cart-header">
                    <div className="cart-title-row">
                        <h3>🛒 My Fresh Cart</h3>
                        <span className="cart-badge">{totalItems} items</span>
                    </div>
                    <button className="btn-close-cart" onClick={() => setIsCartOpen(false)}>✕</button>
                </div>

                {cartItems.length === 0 ? (
                    <div className="cart-empty-state">
                        <div className="cart-empty-icon">🥬</div>
                        <h4>Your cart is empty</h4>
                        <p>Explore surplus produce from your neighbors and add fresh vegetables to your cart!</p>
                        <button className="btn-browse-veggies" onClick={() => setIsCartOpen(false)}>
                            Browse Fresh Produce
                        </button>
                    </div>
                ) : (
                    <div className="cart-content">
                        {/* Cart Items List */}
                        <div className="cart-items-list">
                            {cartItems.map((item) => (
                                <div key={item._id} className="cart-item-card">
                                    <img
                                        src={item.imageUrl || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=200&auto=format&fit=crop&q=80'}
                                        alt={item.title}
                                        className="cart-item-thumb"
                                        onError={(e) => {
                                            e.target.src = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=200&auto=format&fit=crop&q=80';
                                        }}
                                    />
                                    <div className="cart-item-info">
                                        <h4 className="item-title">{item.title}</h4>
                                        <span className="item-category-unit">
                                            ₹{item.price} / {item.unit} • {item.locationArea || 'Local Garden'}
                                        </span>
                                        {item.seller?.name && (
                                            <span className="item-grower">Grower: {item.seller.name}</span>
                                        )}
                                    </div>

                                    {/* Stepper & Delete */}
                                    <div className="item-controls">
                                        <div className="cart-item-stepper">
                                            <button
                                                className="btn-cart-step"
                                                onClick={() => updateQuantity(item._id, -1)}
                                            >
                                                -
                                            </button>
                                            <span className="cart-qty-count">{item.quantity}</span>
                                            <button
                                                className="btn-cart-step"
                                                onClick={() => updateQuantity(item._id, 1)}
                                            >
                                                +
                                            </button>
                                        </div>

                                        <span className="item-total-price">
                                            ₹{item.price * item.quantity}
                                        </span>

                                        <button
                                            className="btn-remove-item"
                                            onClick={() => removeFromCart(item._id)}
                                            title="Remove item"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Bill Summary */}
                        <div className="bill-summary-card">
                            <h4 className="bill-title">Bill Details</h4>
                            <div className="bill-row">
                                <span>Items Total</span>
                                <strong>₹{totalAmount}</strong>
                            </div>
                            <div className="bill-row">
                                <span>Hyperlocal Delivery / Neighbor Drop</span>
                                <span className="free-tag">FREE</span>
                            </div>
                            <div className="bill-divider"></div>
                            <div className="bill-row grand-total">
                                <span>To Pay</span>
                                <span>₹{totalAmount}</span>
                            </div>
                        </div>

                        {/* Checkout & Delivery Details Form */}
                        <form onSubmit={handleCheckout} className="checkout-form">
                            <h4 className="checkout-title">📍 Delivery & Contact Information</h4>

                            {/* Saved Address Summary Mode */}
                            {!isEditingAddress && buyerPhone && buyerAddress ? (
                                <div className="saved-contact-card">
                                    <div className="saved-contact-header">
                                        <div className="saved-contact-left">
                                            <span className="saved-tag">✓ Saved Address</span>
                                            <strong>{buyerName}</strong>
                                        </div>
                                        <button
                                            type="button"
                                            className="btn-edit-saved-address"
                                            onClick={() => setIsEditingAddress(true)}
                                        >
                                            ✏️ Edit
                                        </button>
                                    </div>
                                    <p className="saved-contact-phone">📞 {buyerPhone}</p>
                                    <p className="saved-contact-address">🏠 {buyerAddress}</p>
                                </div>
                            ) : (
                                /* Full Editable Fields Mode */
                                <div className="address-inputs-group">
                                    <div className="checkout-field">
                                        <label>Your Name *</label>
                                        <input
                                            type="text"
                                            placeholder="Enter full name"
                                            value={buyerName}
                                            onChange={(e) => setBuyerName(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="checkout-field">
                                        <label>10-Digit Mobile Number *</label>
                                        <input
                                            type="tel"
                                            placeholder="e.g. 9876543210"
                                            value={buyerPhone}
                                            onChange={(e) => setBuyerPhone(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="checkout-field">
                                        <label>House / Flat No., Society & Street *</label>
                                        <textarea
                                            placeholder="e.g. Flat 302, Block B, Green Heights, Near Temple"
                                            value={buyerAddress}
                                            onChange={(e) => setBuyerAddress(e.target.value)}
                                            rows="2"
                                            required
                                        />
                                    </div>

                                    {buyerPhone && buyerAddress && (
                                        <button
                                            type="button"
                                            className="btn-done-address"
                                            onClick={handleSaveAddressDetails}
                                        >
                                            ✓ Save Delivery Details
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Payment Method */}
                            <div className="checkout-field">
                                <label>Payment Method</label>
                                <div className="payment-options">
                                    <label className="payment-option">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="Cash on Delivery"
                                            checked={paymentMethod === 'Cash on Delivery'}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                        />
                                        <span>💵 Cash on Delivery</span>
                                    </label>
                                    <label className="payment-option">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="UPI on Delivery"
                                            checked={paymentMethod === 'UPI on Delivery'}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                        />
                                        <span>📱 UPI / Pay on Delivery</span>
                                    </label>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="btn-place-order"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Placing Order...' : `Place Order • ₹${totalAmount}`}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}

export default CartDrawer;
