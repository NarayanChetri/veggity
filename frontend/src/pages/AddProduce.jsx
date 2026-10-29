import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { API_URL, handleError, handleSuccess } from '../utils';
import LocationSearch from '../components/LocationSearch';
import './AddProduce.css';

// Biological freshness rules per vegetable category
const CATEGORY_RULES = {
    'Leafy Vegetables': {
        maxDays: 2,
        defaultDays: 1,
        hint: 'Leafy greens spoil rapidly! Maximum safe listing time is 2 days.',
        examples: 'Spinach (Palak), Coriander, Mint (Pudina), Methi',
        defaultImage: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600&auto=format&fit=crop&q=80'
    },
    'Fruit Vegetables': {
        maxDays: 4,
        defaultDays: 2,
        hint: 'Fresh tomatoes, cucumbers, okra stay fresh for up to 4 days.',
        examples: 'Tomatoes, Cucumber, Okra (Bhindi), Brinjal, Beans',
        defaultImage: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80'
    },
    'Root Vegetables': {
        maxDays: 15,
        defaultDays: 7,
        hint: 'Roots and tubers last longer without spoiling.',
        examples: 'Potatoes, Carrots, Radish, Beetroot, Sweet Potato',
        defaultImage: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=600&auto=format&fit=crop&q=80'
    },
    'Bulb Vegetables': {
        maxDays: 15,
        defaultDays: 7,
        hint: 'Onions and garlic store well in cool, dry areas.',
        examples: 'Onions, Garlic, Spring Onions',
        defaultImage: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80'
    },
    'Herbs': {
        maxDays: 5,
        defaultDays: 3,
        hint: 'Fresh culinary herbs stay aromatic for a few days.',
        examples: 'Lemons, Green Chillies, Curry Leaves, Ginger',
        defaultImage: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=600&auto=format&fit=crop&q=80'
    },
    'Other Vegetables': {
        maxDays: 5,
        defaultDays: 3,
        hint: 'Gourds, cabbage, and cauliflower stay crisp for up to 5 days.',
        examples: 'Bottle Gourd (Lauki), Cauliflower, Cabbage, Peas',
        defaultImage: 'https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=600&auto=format&fit=crop&q=80'
    }
};

function AddProduce() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);

    // 1. Verify user is authenticated
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            handleError('Please login first to list surplus produce.');
            navigate('/login');
        }
    }, [navigate]);

    // Check Cloudinary backend configuration status
    const [cloudinaryStatus, setCloudinaryStatus] = useState({ checked: false, isConfigured: false });
    useEffect(() => {
        fetch(`${API_URL}/products/cloudinary-status`)
            .then(res => res.json())
            .then(data => {
                if (data && data.success) {
                    setCloudinaryStatus({ checked: true, isConfigured: Boolean(data.isConfigured) });
                }
            })
            .catch(() => {
                setCloudinaryStatus({ checked: true, isConfigured: false });
            });
    }, []);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        category: 'Leafy Vegetables',
        price: '',
        unit: 'kg',
        quantity: '',
        shelfLifeDays: '1',
        locationArea: '',
        latitude: null,
        longitude: null,
        imageUrl: '',
        description: '',
        harvestMethod: '100% Chemical-Free Homegrown'
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Image upload states
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [isCustomUploaded, setIsCustomUploaded] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    // Dynamic shelf life days list based on current selected category
    const currentCategoryRule = CATEGORY_RULES[formData.category] || CATEGORY_RULES['Leafy Vegetables'];
    const shelfLifeOptions = Array.from({ length: currentCategoryRule.maxDays }, (_, i) => i + 1);

    // Handle standard input field changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    // When category changes, reset shelf life to category default
    const handleCategoryChange = (e) => {
        const selectedCat = e.target.value;
        const rule = CATEGORY_RULES[selectedCat] || CATEGORY_RULES['Leafy Vegetables'];
        setFormData((prev) => ({
            ...prev,
            category: selectedCat,
            shelfLifeDays: String(rule.defaultDays)
        }));
    };

    // When seller selects location or detects GPS / picks pin on map
    const handleLocationSelect = (loc) => {
        setFormData((prev) => ({
            ...prev,
            locationArea: loc.name + (loc.subtitle ? `, ${loc.subtitle}` : ''),
            latitude: loc.lat,
            longitude: loc.lng
        }));
    };

    // Image Upload Handler (Direct from device)
    const handleImageFile = async (file) => {
        if (!file) return;

        // Validate MIME type or file extension (supports smartphone camera shots, HEIC, JPEG, PNG, WEBP)
        const isImage = file.type?.startsWith('image/') || /\.(jpe?g|png|webp|gif|heic|heif)$/i.test(file.name);
        if (!isImage) {
            handleError('Please select a valid image file (JPEG, PNG, WEBP, or GIF).');
            return;
        }

        // Validate file size (up to 10MB to comfortably support modern high-res phone cameras)
        if (file.size > 10 * 1024 * 1024) {
            handleError('Image is too large. Maximum file size is 10MB.');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            handleError('Authentication session expired. Please log in.');
            navigate('/login');
            return;
        }

        setUploadError('');
        setIsUploadingImage(true);

        // Show immediate local preview from device file while uploading to Cloudinary
        const localPreview = URL.createObjectURL(file);
        setFormData(prev => ({ ...prev, imageUrl: localPreview }));

        const uploadData = new FormData();
        uploadData.append('image', file);

        try {
            const response = await fetch(`${API_URL}/products/upload-image`, {
                method: 'POST',
                headers: {
                    'Authorization': token
                },
                body: uploadData
            });

            const result = await response.json();

            if (response.ok && result.success) {
                setFormData(prev => ({ ...prev, imageUrl: result.imageUrl }));
                setIsCustomUploaded(true);
                handleSuccess('Produce photo uploaded from device to Cloudinary successfully!');
            } else {
                // If Cloudinary keys are missing on the server
                if (result.needsConfig) {
                    setUploadError('Cloudinary is not yet configured in backend/.env. Please configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.');
                    handleError('Cloudinary credentials missing on server.');
                } else {
                    setUploadError(result.message || 'Image upload failed.');
                    handleError(result.message || 'Failed to upload image.');
                }
                // Clear temporary preview if upload failed
                setFormData(prev => ({ ...prev, imageUrl: '' }));
                setIsCustomUploaded(false);
            }
        } catch (err) {
            console.error('Image upload network error:', err);
            setUploadError('Network error connecting to backend upload endpoint.');
            handleError('Could not connect to image upload service.');
            setFormData(prev => ({ ...prev, imageUrl: '' }));
            setIsCustomUploaded(false);
        } finally {
            setIsUploadingImage(false);
        }
    };

    const handleFileInputChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            handleImageFile(file);
        }
    };

    const handleCameraInputChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            handleImageFile(file);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            handleImageFile(file);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleRemoveImage = () => {
        setFormData(prev => ({ ...prev, imageUrl: '' }));
        setIsCustomUploaded(false);
        setUploadError('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        if (cameraInputRef.current) {
            cameraInputRef.current.value = '';
        }
    };

    // Handle form submit
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isUploadingImage) {
            return handleError('Please wait for your image to finish uploading to Cloudinary before listing.');
        }

        // Basic client validation
        if (!formData.title.trim()) {
            return handleError('Please enter produce name');
        }
        if (!formData.price || Number(formData.price) <= 0) {
            return handleError('Please enter a valid price');
        }
        if (!formData.quantity || Number(formData.quantity) <= 0) {
            return handleError('Please enter quantity available');
        }
        if (!formData.latitude || !formData.longitude || !formData.locationArea) {
            return handleError('Please set your location or choose pin on map');
        }

        setIsSubmitting(true);

        try {
            const token = localStorage.getItem('token');
            const finalPayload = {
                ...formData,
                imageUrl: formData.imageUrl || currentCategoryRule.defaultImage
            };

            const response = await fetch(`${API_URL}/products/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify(finalPayload)
            });

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                return handleError(`Backend at ${API_URL} returned ${response.status}. Please ensure backend is running.`);
            }

            const result = await response.json();

            if (result.success) {
                handleSuccess(result.message || 'Vegetable listed successfully!');
                setTimeout(() => {
                    navigate('/home');
                }, 1200);
            } else {
                handleError(result.message || 'Failed to list produce');
            }
        } catch (err) {
            handleError(err.message || 'Server error while listing produce');
        } finally {
            setIsSubmitting(false);
        }
    };

    const activeDisplayImage = formData.imageUrl || currentCategoryRule.defaultImage;

    return (
        <div className="add-produce-page">
            <div className="add-produce-card">
                {/* Header */}
                <div className="form-header">
                    <Link to="/home" className="back-link">← Back to Marketplace</Link>
                    <h1>🌱 List Surplus Homegrown Produce</h1>
                    <p className="subtitle">
                        Share surplus vegetables from your garden or farm with nearby neighbors before they spoil.
                    </p>
                </div>

                {/* Cloudinary Info Banner if not configured */}
                {cloudinaryStatus.checked && !cloudinaryStatus.isConfigured && (
                    <div className="cloudinary-setup-banner">
                        <div className="setup-banner-icon">☁️</div>
                        <div className="setup-banner-text">
                            <strong>Cloudinary Storage Ready for Setup:</strong>
                            <span> To enable direct photo uploads, add your Cloudinary API credentials to <code>backend/.env</code>. (Default high-res category photos are active in the meantime).</span>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="produce-form">
                    {/* Produce Title */}
                    <div className="form-group">
                        <label htmlFor="title">Vegetable Name & Variety *</label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            placeholder="e.g. Desi Organic Tomatoes, Fresh Spinach (Paleng Xaak)"
                            value={formData.title}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/* Category Selection */}
                    <div className="form-group">
                        <label htmlFor="category">Category *</label>
                        <select
                            id="category"
                            name="category"
                            value={formData.category}
                            onChange={handleCategoryChange}
                        >
                            {Object.keys(CATEGORY_RULES).map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        <small className="hint-text">
                            <strong>Examples:</strong> {currentCategoryRule.examples}
                        </small>
                    </div>

                    {/* Dynamic Freshness Shelf-Life */}
                    <div className="form-group">
                        <label htmlFor="shelfLifeDays">
                            Fresh Shelf-Life (Days fresh from today) *
                        </label>
                        <select
                            id="shelfLifeDays"
                            name="shelfLifeDays"
                            value={formData.shelfLifeDays}
                            onChange={handleChange}
                        >
                            {shelfLifeOptions.map((days) => (
                                <option key={days} value={days}>
                                    {days} {days === 1 ? 'Day (Ultra Fresh)' : 'Days'}
                                </option>
                            ))}
                        </select>
                        <small className="hint-text shelf-hint">
                            ℹ️ {currentCategoryRule.hint}
                        </small>
                    </div>

                    {/* Price and Unit Row */}
                    <div className="form-row">
                        <div className="form-group flex-1">
                            <label htmlFor="price">Price (₹) *</label>
                            <input
                                type="number"
                                id="price"
                                name="price"
                                min="1"
                                placeholder="e.g. 35"
                                value={formData.price}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group flex-1">
                            <label htmlFor="unit">Unit *</label>
                            <select
                                id="unit"
                                name="unit"
                                value={formData.unit}
                                onChange={handleChange}
                            >
                                <option value="kg">Per kg</option>
                                <option value="500g">Per 500 grams</option>
                                <option value="250g">Per 250 grams</option>
                                <option value="100g">Per 100 grams</option>
                                <option value="bunch">Per bunch</option>
                                <option value="piece">Per piece</option>
                            </select>
                        </div>

                        <div className="form-group flex-1">
                            <label htmlFor="quantity">Total Available *</label>
                            <input
                                type="number"
                                id="quantity"
                                name="quantity"
                                min="1"
                                placeholder="e.g. 10"
                                value={formData.quantity}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    {/* Harvest Method / Cultivation Tag */}
                    <div className="form-group">
                        <label htmlFor="harvestMethod">How Was It Grown?</label>
                        <select
                            id="harvestMethod"
                            name="harvestMethod"
                            value={formData.harvestMethod}
                            onChange={handleChange}
                        >
                            <option value="100% Chemical-Free Homegrown">🌿 100% Chemical-Free Homegrown</option>
                            <option value="Terrace / Balcony Garden">🪴 Terrace / Balcony Garden</option>
                            <option value="Kitchen Garden Compost Grown">🌱 Kitchen Garden Compost Grown</option>
                            <option value="Local Family Agro Patch">🌾 Local Family Agro Patch</option>
                        </select>
                    </div>

                    {/* CLOUDINARY DIRECT DEVICE IMAGE UPLOAD SECTION */}
                    <div className="form-group image-upload-group">
                        <label className="section-label">
                            📸 Produce Photo (Direct Upload from Device)
                        </label>
                        <span className="upload-subtitle">
                            Take a real photo of your harvest with your camera or select from your device!
                        </span>

                        {/* Hidden file input for file manager / gallery */}
                        <input
                            type="file"
                            id="produceImageFile"
                            ref={fileInputRef}
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={handleFileInputChange}
                        />

                        {/* Hidden file input for direct smartphone camera capture */}
                        <input
                            type="file"
                            id="produceCameraFile"
                            ref={cameraInputRef}
                            accept="image/*"
                            capture="environment"
                            style={{ display: 'none' }}
                            onChange={handleCameraInputChange}
                        />

                        {/* Uploading Progress State */}
                        {isUploadingImage && (
                            <div className="upload-progress-box">
                                <div className="upload-spinner"></div>
                                <div className="upload-progress-text">
                                    <strong>Uploading directly to Cloudinary...</strong>
                                    <span>Processing photo and creating instant high-res CDN link</span>
                                </div>
                            </div>
                        )}

                        {/* Drop Zone (Shown when no custom image is uploaded and not uploading) */}
                        {!formData.imageUrl && !isUploadingImage && (
                            <div
                                className={`image-drop-zone ${isDragging ? 'dragging' : ''}`}
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <div className="drop-icon">📸 🌿</div>
                                <div className="drop-main-text">
                                    <strong>Upload Photo Directly from Device</strong>
                                </div>
                                <div className="drop-sub-text">
                                    Snap with camera or select from gallery / files (or drag & drop here)
                                </div>
                                <div className="upload-btn-group" onClick={(e) => e.stopPropagation()}>
                                    <button
                                        type="button"
                                        className="btn-upload-action btn-camera"
                                        onClick={() => cameraInputRef.current?.click()}
                                    >
                                        📷 Take Photo (Camera)
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-upload-action btn-browse"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        📁 Choose from Device
                                    </button>
                                </div>
                                <small className="drop-footnote">
                                    Stored on Cloudinary CDN • Supports JPG, PNG, WEBP, HEIC up to 10MB
                                </small>
                            </div>
                        )}

                        {/* Upload Error Box */}
                        {uploadError && (
                            <div className="upload-error-box">
                                <span className="error-icon">⚠️</span>
                                <span className="error-text">{uploadError}</span>
                            </div>
                        )}

                        {/* Custom Uploaded Image Preview */}
                        {formData.imageUrl && !isUploadingImage && (
                            <div className="custom-image-preview-card">
                                <div className="preview-media">
                                    <img
                                        src={formData.imageUrl}
                                        alt="Uploaded produce"
                                        className="preview-img"
                                    />
                                    <span className="preview-badge cloudinary-badge">
                                        ☁️ Uploaded to Cloudinary
                                    </span>
                                </div>
                                <div className="preview-actions">
                                    <button
                                        type="button"
                                        className="btn-change-image"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        🔄 Replace Photo
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-remove-image"
                                        onClick={handleRemoveImage}
                                    >
                                        🗑️ Remove
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Fallback / Default Image Preview Note */}
                        {!formData.imageUrl && !isUploadingImage && (
                            <div className="category-default-preview">
                                <div className="category-preview-left">
                                    <img
                                        src={currentCategoryRule.defaultImage}
                                        alt={formData.category}
                                        className="category-mini-thumb"
                                    />
                                    <div className="category-preview-desc">
                                        <span className="default-tag">Optional Default Category Photo</span>
                                        <small>Used automatically if you prefer not to upload your own photo.</small>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Description & Story */}
                    <div className="form-group">
                        <label htmlFor="description">Garden Notes & Description</label>
                        <textarea
                            id="description"
                            name="description"
                            rows="2"
                            placeholder="e.g. Plucked fresh this morning from our terrace pots. Sweet and juicy, completely chemical-free."
                            value={formData.description}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Accurate Location Selection with Pin on Map */}
                    <div className="form-group location-group">
                        <label>Your Pickup Location / Neighborhood *</label>
                        <p className="location-instruction">
                            Search your locality, click <strong>Auto Detect GPS</strong>, or tap <strong>Choose Pin on Map</strong> to set your exact garden spot.
                        </p>
                        <LocationSearch
                            placeholder="Type colony, village, university or pick pin on map..."
                            onLocationSelect={handleLocationSelect}
                        />
                        {formData.latitude && formData.longitude && (
                            <div className="location-confirmed-box">
                                ✓ Location Locked: <strong>{formData.locationArea}</strong>
                                <small>({formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)})</small>
                            </div>
                        )}
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="btn-submit-produce"
                        disabled={isSubmitting || isUploadingImage}
                    >
                        {isSubmitting
                            ? 'Publishing Produce...'
                            : isUploadingImage
                                ? 'Uploading Image...'
                                : '🌿 List Produce for Neighbors'}
                    </button>
                </form>
            </div>
            <ToastContainer />
        </div>
    );
}

export default AddProduce;
