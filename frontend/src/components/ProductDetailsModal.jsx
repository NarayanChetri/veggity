import React from 'react';
import { useCart } from '../context/CartContext';
import './ProductDetailsModal.css';

// Helper: Calculate dynamic countdown freshness badge from expiresAt
const getFreshnessBadge = (expiresAt) => {
    const diffMs = new Date(expiresAt).getTime() - Date.now();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));

    if (diffHours <= 0) {
        return { text: 'Expired', badgeClass: 'badge-expired' };
    }
    if (diffHours < 12) {
        return { text: `⏰ Only ${diffHours}h left!`, badgeClass: 'badge-urgent' };
    }
    if (diffHours < 24) {
        return { text: `⏰ ${diffHours}h fresh left`, badgeClass: 'badge-warning' };
    }
    const days = Math.floor(diffHours / 24);
    return { text: `🌿 ${days}d fresh left`, badgeClass: 'badge-fresh' };
};

function ProductDetailsModal({ product, onClose }) {
    const { addToCart, updateQuantity, getItemQuantity, setIsCartOpen } = useCart();

    if (!product) return null;

    const freshness = getFreshnessBadge(product.expiresAt);
    const qtyInCart = getItemQuantity(product._id);

    // Fallback high-res garden image if none provided
    const displayImage = product.imageUrl || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80';

    const handleAddToCartAndOpen = () => {
        addToCart(product);
    };

    return (
        <div className="product-modal-backdrop" onClick={onClose}>
            <div className="product-modal-card" onClick={(e) => e.stopPropagation()}>
                {/* Close Button */}
                <button className="btn-close-product-modal" onClick={onClose}>✕</button>

                {/* Hero Produce Image */}
                <div className="product-modal-image-wrapper">
                    <img
                        src={displayImage}
                        alt={product.title}
                        className="product-modal-img"
                        onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80';
                        }}
                    />
                    <div className="image-overlay-badges">
                        <span className="modal-cat-tag">{product.category}</span>
                        <span className={`modal-freshness-tag ${freshness.badgeClass}`}>
                            {freshness.text}
                        </span>
                    </div>
                </div>

                {/* Modal Scrollable Body */}
                <div className="product-modal-body">
                    {/* Title & Pricing */}
                    <div className="product-main-header">
                        <h2 className="product-detail-title">{product.title}</h2>
                        <div className="product-price-row">
                            <span className="price-bold">₹{product.price}</span>
                            <span className="unit-label">/ {product.unit}</span>
                            <span className="stock-pill">📦 {product.quantity} {product.unit} available</span>
                        </div>
                    </div>

                    {/* Lister Profile & Rating Card */}
                    <div className="lister-profile-card">
                        <div className="lister-avatar">
                            <span>🌱</span>
                        </div>
                        <div className="lister-details">
                            <div className="lister-name-row">
                                <h4 className="lister-name">{product.seller?.name || 'Local Verified Neighbor'}</h4>
                                <span className="verified-badge">✓ Verified Grower</span>
                            </div>
                            <div className="lister-rating-row">
                                <span className="rating-star">⭐ {product.rating || '4.9'}</span>
                                <span className="rating-count">({product.ratingCount || '18'} neighbor reviews)</span>
                            </div>
                            <span className="lister-location-text">
                                📍 {product.locationArea}
                                {product.distanceKm !== null && product.distanceKm !== undefined && (
                                    <strong> • {product.distanceKm} km away</strong>
                                )}
                            </span>
                        </div>
                    </div>

                    {/* Highlights / Badges */}
                    <div className="product-highlights-row">
                        <div className="highlight-pill">
                            <span>🌿</span>
                            <span>{product.harvestMethod || '100% Chemical-Free'}</span>
                        </div>
                        <div className="highlight-pill">
                            <span>⏰</span>
                            <span>Fresh Shelf-Life: {product.shelfLifeDays} Days</span>
                        </div>
                    </div>

                    {/* Description / Story */}
                    <div className="product-description-section">
                        <h4>Garden Notes & Description</h4>
                        <p>
                            {product.description ||
                                'Harvested fresh from our backyard garden patch in the local neighborhood. Grown completely chemical-free using home compost. Plucked at peak freshness for maximum taste and nutrition.'}
                        </p>
                    </div>

                    {/* Hyperlocal Pickup Details */}
                    <div className="pickup-details-box">
                        <h4>📍 Pickup & Delivery Note</h4>
                        <p>
                            This produce is located near <strong>{product.locationArea}</strong>. When you place an order, the grower receives your address and phone number for immediate pickup or neighborhood drop-off.
                        </p>
                    </div>
                </div>

                {/* Fixed Bottom Action Bar */}
                <div className="product-modal-footer">
                    <div className="footer-pricing-preview">
                        <span className="footer-price-subtext">Total Price</span>
                        <span className="footer-price-amount">
                            ₹{product.price * Math.max(1, qtyInCart)}
                        </span>
                    </div>

                    <div className="footer-actions-group">
                        {(() => {
                            const loggedInEmail = (localStorage.getItem('loggedInEmail') || '').toLowerCase().trim();
                            const loggedInUser = (localStorage.getItem('loggedInUser') || '').toLowerCase().trim();
                            const isOwnProduct = Boolean(
                                (loggedInEmail && product.seller?.email?.toLowerCase() === loggedInEmail) ||
                                (loggedInUser && product.seller?.name?.toLowerCase() === loggedInUser)
                            );

                            if (isOwnProduct) {
                                return (
                                    <div className="modal-own-listing-notice">
                                        🌿 You listed this produce in your garden inventory
                                    </div>
                                );
                            }

                            if (qtyInCart === 0) {
                                return (
                                    <button className="btn-modal-add-cart" onClick={handleAddToCartAndOpen}>
                                        🛒 Add to Cart • ₹{product.price}
                                    </button>
                                );
                            }

                            return (
                                <div className="modal-stepper-group">
                                    <div className="modal-qty-stepper">
                                        <button
                                            className="btn-modal-step"
                                            onClick={() => updateQuantity(product._id, -1)}
                                        >
                                            -
                                        </button>
                                        <span className="modal-qty-val">{qtyInCart} in cart</span>
                                        <button
                                            className="btn-modal-step"
                                            onClick={() => updateQuantity(product._id, 1)}
                                            disabled={qtyInCart >= product.quantity}
                                        >
                                            +
                                        </button>
                                    </div>
                                    <button
                                        className="btn-view-cart-direct"
                                        onClick={() => {
                                            onClose();
                                            setIsCartOpen(true);
                                        }}
                                    >
                                        View Cart →
                                    </button>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProductDetailsModal;

