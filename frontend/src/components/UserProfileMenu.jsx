import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './UserProfileMenu.css';

function UserProfileMenu({ userName, onLogout, onOpenAccountDetails, onOpenOrders }) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    const displayName = userName || 'Neighbor';
    const initial = displayName.charAt(0).toUpperCase();

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div className="user-profile-menu-wrapper" ref={menuRef}>
            {/* The Interactive Profile Button */}
            <button
                type="button"
                className={`user-profile-btn ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                aria-label="User Profile Menu"
            >
                <div className="profile-btn-avatar">
                    {initial}
                </div>
                <span className="profile-btn-name">{displayName}</span>
                <span className={`profile-btn-chevron ${isOpen ? 'chevron-up' : ''}`}>▾</span>
            </button>

            {/* Profile Dropdown Card */}
            {isOpen && (
                <div className="profile-dropdown-card">
                    {/* Header */}
                    <div className="dropdown-user-header">
                        <div className="dropdown-avatar-circle">
                            {initial}
                        </div>
                        <div className="dropdown-user-text">
                            <span className="dropdown-greeting">Hi, <strong>{displayName}</strong> 👋</span>
                            <span className="dropdown-badge">🌱 Verified Veggity Neighbor</span>
                        </div>
                    </div>

                    <div className="dropdown-divider" />

                    {/* Navigation Actions */}
                    <div className="dropdown-menu-list">
                        <button
                            type="button"
                            className="dropdown-menu-item"
                            onClick={() => {
                                setIsOpen(false);
                                onOpenAccountDetails();
                            }}
                        >
                            <span className="dropdown-item-icon">👤</span>
                            <div className="dropdown-item-content">
                                <span className="dropdown-item-title">Account Details</span>
                                <span className="dropdown-item-desc">Name, email & location profile</span>
                            </div>
                        </button>

                        <button
                            type="button"
                            className="dropdown-menu-item"
                            onClick={() => {
                                setIsOpen(false);
                                onOpenOrders();
                            }}
                        >
                            <span className="dropdown-item-icon">🛍️</span>
                            <div className="dropdown-item-content">
                                <span className="dropdown-item-title">My Orders</span>
                                <span className="dropdown-item-desc">Track purchases & delivery status</span>
                            </div>
                        </button>

                        <Link
                            to="/dashboard"
                            className="dropdown-menu-item"
                            onClick={() => setIsOpen(false)}
                        >
                            <span className="dropdown-item-icon">📊</span>
                            <div className="dropdown-item-content">
                                <span className="dropdown-item-title">Grower Dashboard</span>
                                <span className="dropdown-item-desc">Manage received orders & listings</span>
                            </div>
                        </Link>

                        <Link
                            to="/add-produce"
                            className="dropdown-menu-item"
                            onClick={() => setIsOpen(false)}
                        >
                            <span className="dropdown-item-icon">🌿</span>
                            <div className="dropdown-item-content">
                                <span className="dropdown-item-title">+ Sell Produce</span>
                                <span className="dropdown-item-desc">List homegrown garden surplus</span>
                            </div>
                        </Link>
                    </div>

                    <div className="dropdown-divider" />

                    {/* Logout Option */}
                    <div className="dropdown-logout-row">
                        <button
                            type="button"
                            className="btn-dropdown-logout"
                            onClick={() => {
                                setIsOpen(false);
                                onLogout();
                            }}
                        >
                            <span className="logout-icon">🚪</span>
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default UserProfileMenu;

