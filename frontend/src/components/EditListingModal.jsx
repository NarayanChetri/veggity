import React, { useState, useEffect, useRef } from 'react';
import { API_URL, handleError, handleSuccess } from '../utils';
import './EditListingModal.css';

const CATEGORIES = [
    'Leafy Vegetables',
    'Fruit Vegetables',
    'Root Vegetables',
    'Bulb Vegetables',
    'Herbs',
    'Other Vegetables'
];

const UNITS = ['kg', 'bunch', 'piece', '500g', '250g', '100g'];

function EditListingModal({ isOpen, product, onClose, onUpdated }) {
    const fileInputRef = useRef(null);
    const [formData, setFormData] = useState({
        title: '',
        category: 'Leafy Vegetables',
        price: '',
        unit: 'kg',
        quantity: '',
        shelfLifeDays: 3,
        locationArea: '',
        harvestMethod: '',
        imageUrl: '',
        description: '',
        isAvailable: true
    });

    const [submitting, setSubmitting] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [showManualUrl, setShowManualUrl] = useState(false);

    useEffect(() => {
        if (product) {
            setFormData({
                title: product.title || '',
                category: product.category || 'Leafy Vegetables',
                price: product.price ?? '',
                unit: product.unit || 'kg',
                quantity: product.quantity ?? '',
                shelfLifeDays: product.shelfLifeDays ?? 3,
                locationArea: product.locationArea || '',
                harvestMethod: product.harvestMethod || '100% Chemical-Free Homegrown',
                imageUrl: product.imageUrl || '',
                description: product.description || '',
                isAvailable: product.isAvailable !== false
            });
            setUploadError('');
            setShowManualUrl(false);
        }
    }, [product]);

    if (!isOpen || !product) return null;

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Cloudinary Direct Image Upload Handler
    const handleImageFile = async (file) => {
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            handleError('Please select a valid image file (JPEG, PNG, WEBP, or GIF).');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            handleError('Image is too large. Maximum file size is 5MB.');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            handleError('Session expired. Please log in.');
            return;
        }

        setIsUploadingImage(true);
        setUploadError('');

        // Immediate local blob preview
        const localPreview = URL.createObjectURL(file);
        setFormData((prev) => ({ ...prev, imageUrl: localPreview }));

        const uploadData = new FormData();
        uploadData.append('image', file);

        try {
            const response = await fetch(`${API_URL}/products/upload-image`, {
                method: 'POST',
                headers: {
                    Authorization: token
                },
                body: uploadData
            });

            const result = await response.json();

            if (response.ok && result.success) {
                setFormData((prev) => ({ ...prev, imageUrl: result.imageUrl }));
                handleSuccess('Produce image uploaded to Cloudinary successfully!');
            } else {
                setUploadError(result.message || 'Image upload failed.');
                handleError(result.message || 'Failed to upload image.');
            }
        } catch (err) {
            console.error('Image upload network error:', err);
            setUploadError('Network error connecting to image upload service.');
            handleError('Could not connect to image upload service.');
        } finally {
            setIsUploadingImage(false);
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) handleImageFile(file);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleImageFile(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            return handleError('Please provide a title for your produce');
        }
        if (!formData.price || Number(formData.price) <= 0) {
            return handleError('Please enter a valid price');
        }
        if (!formData.quantity || Number(formData.quantity) <= 0) {
            return handleError('Please enter available stock quantity');
        }

        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/orders/my-listings/${product._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: token
                },
                body: JSON.stringify({
                    title: formData.title,
                    category: formData.category,
                    price: Number(formData.price),
                    unit: formData.unit,
                    quantity: Number(formData.quantity),
                    shelfLifeDays: Number(formData.shelfLifeDays),
                    locationArea: formData.locationArea,
                    harvestMethod: formData.harvestMethod,
                    imageUrl: formData.imageUrl,
                    description: formData.description,
                    isAvailable: formData.isAvailable
                })
            });

            const data = await res.json();
            if (data.success) {
                handleSuccess('Produce listing updated successfully!');
                onUpdated(data.product);
                onClose();
            } else {
                handleError(data.message || 'Failed to update produce listing');
            }
        } catch (err) {
            console.error('Update produce error:', err);
            handleError('Could not connect to server to update listing');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="edit-modal-backdrop" onClick={onClose}>
            <div className="edit-modal-card" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="edit-modal-header">
                    <div className="edit-modal-title-group">
                        <span className="edit-modal-icon">✏️</span>
                        <div>
                            <h3>Edit Produce Listing</h3>
                            <p>Update title, descriptions, price, photos, and stock details</p>
                        </div>
                    </div>
                    <button type="button" className="btn-close-edit-modal" onClick={onClose}>✕</button>
                </div>

                {/* Body Form */}
                <form onSubmit={handleSubmit} className="edit-modal-form">
                    <div className="edit-form-scrollable">
                        {/* Title */}
                        <div className="edit-form-group">
                            <label htmlFor="edit-title">Produce Title / Name *</label>
                            <input
                                id="edit-title"
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="e.g. Desi Organic Hybrid Tomatoes (Bilahi)"
                                required
                            />
                        </div>

                        {/* Category & Harvest Method */}
                        <div className="edit-form-row">
                            <div className="edit-form-group">
                                <label htmlFor="edit-category">Category *</label>
                                <select
                                    id="edit-category"
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                >
                                    {CATEGORIES.map((cat) => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="edit-form-group">
                                <label htmlFor="edit-harvest">Harvest Method</label>
                                <input
                                    id="edit-harvest"
                                    type="text"
                                    name="harvestMethod"
                                    value={formData.harvestMethod}
                                    onChange={handleChange}
                                    placeholder="e.g. 100% Chemical-Free Terrace Garden"
                                />
                            </div>
                        </div>

                        {/* Price, Unit & Quantity */}
                        <div className="edit-form-row three-col">
                            <div className="edit-form-group">
                                <label htmlFor="edit-price">Price (₹) *</label>
                                <input
                                    id="edit-price"
                                    type="number"
                                    name="price"
                                    min="1"
                                    step="any"
                                    value={formData.price}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="edit-form-group">
                                <label htmlFor="edit-unit">Unit *</label>
                                <select
                                    id="edit-unit"
                                    name="unit"
                                    value={formData.unit}
                                    onChange={handleChange}
                                >
                                    {UNITS.map((u) => (
                                        <option key={u} value={u}>{u}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="edit-form-group">
                                <label htmlFor="edit-qty">Stock Available *</label>
                                <input
                                    id="edit-qty"
                                    type="number"
                                    name="quantity"
                                    min="1"
                                    value={formData.quantity}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        {/* Shelf Life & Location Area */}
                        <div className="edit-form-row">
                            <div className="edit-form-group">
                                <label htmlFor="edit-shelflife">Fresh Shelf-Life (Days) *</label>
                                <input
                                    id="edit-shelflife"
                                    type="number"
                                    name="shelfLifeDays"
                                    min="1"
                                    max="30"
                                    value={formData.shelfLifeDays}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="edit-form-group">
                                <label htmlFor="edit-location">Neighborhood / Area *</label>
                                <input
                                    id="edit-location"
                                    type="text"
                                    name="locationArea"
                                    value={formData.locationArea}
                                    onChange={handleChange}
                                    placeholder="e.g. Staff Quarters, Napaam, Tezpur"
                                    required
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div className="edit-form-group">
                            <label htmlFor="edit-description">Produce Description & Garden Story</label>
                            <textarea
                                id="edit-description"
                                name="description"
                                rows="3"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Describe the taste, organic farming methods, freshness, or recipes..."
                            />
                        </div>

                        {/* Cloudinary Image Upload Section */}
                        <div className="edit-form-group">
                            <div className="edit-photo-header">
                                <label>Produce Photo (Cloudinary Upload)</label>
                                <button
                                    type="button"
                                    className="btn-toggle-manual-url"
                                    onClick={() => setShowManualUrl(!showManualUrl)}
                                >
                                    {showManualUrl ? '← Upload photo file instead' : '🔗 Enter image URL instead'}
                                </button>
                            </div>

                            {/* Hidden file input for Cloudinary upload */}
                            <input
                                type="file"
                                ref={fileInputRef}
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={handleFileSelect}
                            />

                            {!showManualUrl ? (
                                <div
                                    className={`cloudinary-upload-dropzone ${isDragging ? 'dragging' : ''}`}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onClick={() => !isUploadingImage && fileInputRef.current?.click()}
                                >
                                    {isUploadingImage ? (
                                        <div className="upload-loading-state">
                                            <div className="upload-spinner" />
                                            <span>Uploading produce photo to Cloudinary...</span>
                                        </div>
                                    ) : formData.imageUrl ? (
                                        <div className="uploaded-photo-preview-wrap">
                                            <img
                                                src={formData.imageUrl}
                                                alt="Produce preview"
                                                className="uploaded-photo-thumb"
                                                onError={(e) => {
                                                    e.target.src = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300&auto=format&fit=crop&q=80';
                                                }}
                                            />
                                            <div className="uploaded-photo-overlay">
                                                <span>📸 Click or drag to replace photo via Cloudinary</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="dropzone-empty-state">
                                            <span className="dropzone-icon">📷</span>
                                            <strong>Click or drag & drop to upload photo</strong>
                                            <small>Stored directly on Cloudinary (PNG, JPG, WEBP up to 5MB)</small>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="manual-url-input-wrap">
                                    <input
                                        type="url"
                                        name="imageUrl"
                                        value={formData.imageUrl}
                                        onChange={handleChange}
                                        placeholder="https://images.unsplash.com/photo-..."
                                    />
                                    {formData.imageUrl && (
                                        <img
                                            src={formData.imageUrl}
                                            alt="Preview"
                                            className="manual-thumb-preview"
                                            onError={(e) => {
                                                e.target.src = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300&auto=format&fit=crop&q=80';
                                            }}
                                        />
                                    )}
                                </div>
                            )}

                            {uploadError && <p className="edit-upload-error">{uploadError}</p>}
                        </div>

                        {/* Availability Toggle */}
                        <div className="edit-checkbox-row">
                            <label className="checkbox-container">
                                <input
                                    type="checkbox"
                                    name="isAvailable"
                                    checked={formData.isAvailable}
                                    onChange={handleChange}
                                />
                                <span className="checkbox-label">
                                    <strong>Mark as Active & In-Stock</strong>
                                    <small>Uncheck if currently out of stock or taking a break from selling</small>
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="edit-modal-footer">
                        <button
                            type="button"
                            className="btn-cancel-edit"
                            onClick={onClose}
                            disabled={submitting || isUploadingImage}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-save-edit"
                            disabled={submitting || isUploadingImage}
                        >
                            {submitting ? 'Saving Changes...' : '💾 Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EditListingModal;
