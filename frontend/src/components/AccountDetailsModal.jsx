import React, { useState, useEffect } from 'react';
import { API_URL } from '../utils';
import './AccountDetailsModal.css';

function AccountDetailsModal({ isOpen, onClose, userName, onOpenOrders }) {
    const [profile, setProfile] = useState({
        name: userName || 'Neighbor',
        email: localStorage.getItem('loggedInEmail') || '',
        role: 'Verified Local Neighbor & Grower'
    });

    const [savedLocation, setSavedLocation] = useState('');

    useEffect(() => {
        if (!isOpen) return;

        // Load saved default location
        try {
            const loc = localStorage.getItem('veggity_location');
            if (loc) {
                const parsed = JSON.parse(loc);
                setSavedLocation(parsed.name + (parsed.subtitle ? `, ${parsed.subtitle}` : ''));
            }
        } catch (_e) {}

        // Optionally fetch fresh profile from backend
        const token = localStorage.getItem('token');
        if (token) {
            fetch(`${API_URL}/auth/profile`, {
                headers: { Authorization: token }
            })
                .then((res) => res.json())
                .then((data) => {
                    if (data.success && data.user) {
                        setProfile((prev) => ({
                            ...prev,
                            name: data.user.name || prev.name,
                            email: data.user.email || prev.email,
                            role: data.user.role || prev.role
                        }));
                    }
                })
                .catch(() => {});
        }
    }, [isOpen, userName]);

    if (!isOpen) return null;

    const initial = (profile.name || 'U').charAt(0).toUpperCase();

    return (
        <div className="account-modal-backdrop" onClick={onClose}>
            <div className="account-modal-card" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="account-modal-header">
                    <h3>👤 Account & Profile Details</h3>
                    <button className="btn-close-account-modal" onClick={onClose}>✕</button>
                </div>

                {/* Profile Hero Box */}
                <div className="account-hero-box">
                    <div className="account-avatar-large">
                        {initial}
                    </div>
                    <div className="account-hero-text">
                        <h4>{profile.name}</h4>
                        <span className="account-badge-pill">🌱 {profile.role}</span>
                    </div>
                </div>

                {/* Info List */}
                <div className="account-details-body">
                    <div className="account-info-row">
                        <span className="account-field-label">Full Name</span>
                        <strong className="account-field-value">{profile.name}</strong>
                    </div>

                    <div className="account-info-row">
                        <span className="account-field-label">Email Address</span>
                        <strong className="account-field-value">
                            {profile.email || 'Not provided'}
                        </strong>
                    </div>

                    <div className="account-info-row">
                        <span className="account-field-label">Member Status</span>
                        <span className="status-active-badge">✓ Active Verified Neighbor</span>
                    </div>

                    <div className="account-info-row">
                        <span className="account-field-label">Default Locality</span>
                        <strong className="account-field-value">
                            📍 {savedLocation || 'Tezpur University, Assam'}
                        </strong>
                    </div>

                    <div className="account-info-row">
                        <span className="account-field-label">Account Capabilities</span>
                        <div className="capabilities-pills">
                            <span className="cap-pill">🛒 Buy Fresh Produce</span>
                            <span className="cap-pill">🌿 List Garden Surplus</span>
                            <span className="cap-pill">📍 Pin GPS Location</span>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="account-modal-footer">
                    {onOpenOrders && (
                        <button
                            type="button"
                            className="btn-account-orders"
                            onClick={() => {
                                onClose();
                                onOpenOrders();
                            }}
                        >
                            🛍️ View My Orders
                        </button>
                    )}
                    <button type="button" className="btn-account-close" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AccountDetailsModal;

