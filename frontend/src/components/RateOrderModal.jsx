import React, { useState } from 'react';
import { API_URL, handleError, handleSuccess } from '../utils';
import './RateOrderModal.css';

const STAR_LABELS = {
    1: 'Disappointing',
    2: 'Fair',
    3: 'Good Quality',
    4: 'Very Fresh & Tasty',
    5: 'Outstanding Garden Harvest! 🌿'
};

function RateOrderModal({ isOpen, order, onClose, onRated }) {
    const [score, setScore] = useState(5);
    const [hoverScore, setHoverScore] = useState(0);
    const [review, setReview] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen || !order) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/orders/${order._id}/rate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: token
                },
                body: JSON.stringify({
                    score: Number(score),
                    review: review.trim()
                })
            });

            const data = await res.json();
            if (data.success) {
                handleSuccess('⭐ Thank you for rating your fresh harvest!');
                if (onRated) onRated(data.order);
                onClose();
            } else {
                handleError(data.message || 'Failed to submit rating');
            }
        } catch (err) {
            console.error('Rate order error:', err);
            handleError('Could not connect to server to submit rating');
        } finally {
            setSubmitting(false);
        }
    };

    const activeStarValue = hoverScore || score;

    return (
        <div className="rate-modal-backdrop" onClick={onClose}>
            <div className="rate-modal-card" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="rate-modal-header">
                    <div className="rate-header-title">
                        <span className="rate-header-icon">⭐</span>
                        <div>
                            <h3>Rate Delivered Harvest</h3>
                            <p>Order #{order._id.slice(-6).toUpperCase()} • Delivered Fresh</p>
                        </div>
                    </div>
                    <button type="button" className="btn-close-rate-modal" onClick={onClose}>✕</button>
                </div>

                <form onSubmit={handleSubmit} className="rate-modal-body">
                    {/* Items List Preview */}
                    <div className="rate-items-summary">
                        <span className="rate-items-label">Produce in this delivery:</span>
                        <div className="rate-items-pills">
                            {order.items.map((it, idx) => (
                                <span key={idx} className="rate-item-pill">
                                    🥬 {it.title} ({it.quantity} {it.unit || 'kg'})
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Star Rating Selector */}
                    <div className="star-rating-section">
                        <label className="rate-field-label">How fresh was this garden produce?</label>
                        <div className="stars-row" onMouseLeave={() => setHoverScore(0)}>
                            {[1, 2, 3, 4, 5].map((val) => (
                                <button
                                    key={val}
                                    type="button"
                                    className={`star-btn ${val <= activeStarValue ? 'star-filled' : 'star-empty'}`}
                                    onMouseEnter={() => setHoverScore(val)}
                                    onClick={() => setScore(val)}
                                    aria-label={`${val} Stars`}
                                >
                                    ★
                                </button>
                            ))}
                        </div>
                        <span className="star-feedback-text">
                            {STAR_LABELS[activeStarValue] || 'Select stars'}
                        </span>
                    </div>

                    {/* Review Feedback */}
                    <div className="review-textarea-section">
                        <label htmlFor="rate-review" className="rate-field-label">
                            Share feedback for your neighbor grower (optional)
                        </label>
                        <textarea
                            id="rate-review"
                            rows="3"
                            value={review}
                            onChange={(e) => setReview(e.target.value)}
                            placeholder="e.g. Crisp, sweet tomatoes and tender greens! Plucked the same morning, loved it."
                        />
                    </div>

                    {/* Footer */}
                    <div className="rate-modal-footer">
                        <button
                            type="button"
                            className="btn-cancel-rate"
                            onClick={onClose}
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-submit-rate"
                            disabled={submitting}
                        >
                            {submitting ? 'Submitting...' : 'Submit Rating ⭐'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default RateOrderModal;

