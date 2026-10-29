import React, { useState, useEffect } from 'react';
import { API_URL, handleSuccess } from '../utils';
import './AccountDetailsModal.css';

function AccountDetailsModal({ isOpen, onClose, userName, onOpenOrders }) {
    const [profile, setProfile] = useState({
        name: userName || 'Neighbor',
        email: localStorage.getItem('loggedInEmail') || '',
        role: 'Verified Local Neighbor & Grower'
    });

    const [savedLocation, setSavedLocation] = useState('');
    const [savedPhone, setSavedPhone] = useState('');
    const [savedAddress, setSavedAddress] = useState('');
    const [isEditingContact, setIsEditingContact] = useState(false);
    const [editPhone, setEditPhone] = useState('');
    const [editAddress, setEditAddress] = useState('');

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

        const phone = localStorage.getItem('veggity_saved_phone') || '';
        const address = localStorage.getItem('veggity_saved_address') || '';
        setSavedPhone(phone);
        setSavedAddress(address);
        setEditPhone(phone);
        setEditAddress(address);

        // Fetch fresh profile from backend
        const token = localStorage.getItem('token');
        if (token) {
            fetch(`${API_URL}/auth/profile`, {
                headers: { Authorization: token }
            })
                .then(async (res) => {
                    const contentType = res.headers.get('content-type');
                    if (!contentType || !contentType.includes('application/json')) {
                        return null;
                    }
                    return res.json();
                })
                .then((data) => {
                    if (data && data.success && data.user) {
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

    const handleSaveContact = (e) => {
        e.preventDefault();
        localStorage.setItem('veggity_saved_phone', editPhone.trim());
        localStorage.setItem('veggity_saved_address', editAddress.trim());
        setSavedPhone(editPhone.trim());
        setSavedAddress(editAddress.trim());
        setIsEditingContact(false);
        handleSuccess('Delivery address and contact phone updated!');
    };

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

                    {/* Saved Phone & Delivery Address */}
                    <div className="account-contact-box">
                        <div className="account-contact-header">
                            <span className="account-field-label">📦 Saved Delivery Address & Phone</span>
                            {!isEditingContact && (
                                <button
                                    type="button"
                                    className="btn-edit-account-contact"
                                    onClick={() => setIsEditingContact(true)}
                                >
                                    ✏️ Edit Details
                                </button>
                            )}
                        </div>

                        {!isEditingContact ? (
                            <div className="account-contact-view">
                                <div className="account-info-row sub-row">
                                    <span>Phone:</span>
                                    <strong>{savedPhone ? `📞 ${savedPhone}` : 'No phone number saved yet'}</strong>
                                </div>
                                <div className="account-info-row sub-row">
                                    <span>Address:</span>
                                    <strong>{savedAddress ? `🏠 ${savedAddress}` : 'No address saved yet'}</strong>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSaveContact} className="account-contact-form">
                                <div className="form-mini-field">
                                    <label>Mobile Number</label>
                                    <input
                                        type="tel"
                                        placeholder="10-digit mobile number"
                                        value={editPhone}
                                        onChange={(e) => setEditPhone(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-mini-field">
                                    <label>House / Society / Street Address</label>
                                    <textarea
                                        rows="2"
                                        placeholder="e.g. Flat 204, Nilachal Quarters, Napaam"
                                        value={editAddress}
                                        onChange={(e) => setEditAddress(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-mini-actions">
                                    <button
                                        type="button"
                                        className="btn-cancel-mini"
                                        onClick={() => setIsEditingContact(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-save-mini">
                                        ✓ Save Details
                                    </button>
                                </div>
                            </form>
                        )}
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
