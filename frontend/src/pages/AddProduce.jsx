import React, { useState, useEffect } from 'react';
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

    // 1. Verify user is authenticated
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            handleError('Please login first to list surplus produce.');
            navigate('/login');
        }
    }, [navigate]);

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

    // Dynamic shelf life days list based on current selected category
    const currentCategoryRule = CATEGORY_RULES[formData.category] || CATEGORY_RULES['Leafy Vegetables'];
    const shelfLifeOptions = Array.from({ length: currentCategoryRule.maxDays }, (_, i) => i + 1);

    // Handle input field changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    // When category changes, reset shelf life to category default & suggest image
    const handleCategoryChange = (e) => {
        const selectedCat = e.target.value;
        const rule = CATEGORY_RULES[selectedCat] || CATEGORY_RULES['Leafy Vegetables'];
        setFormData((prev) => ({
            ...prev,
            category: selectedCat,
            shelfLifeDays: String(rule.defaultDays),
            imageUrl: prev.imageUrl || rule.defaultImage
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

    // Handle form submit
    const handleSubmit = async (e) => {
        e.preventDefault();

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

                    {/* Produce Photo URL */}
                    <div className="form-group">
                        <label htmlFor="imageUrl">Produce Photo URL (Optional)</label>
                        <input
                            type="url"
                            id="imageUrl"
                            name="imageUrl"
                            placeholder="Paste image link or leave empty to use fresh category photo"
                            value={formData.imageUrl}
                            onChange={handleChange}
                        />
                        <small className="hint-text">
                            📸 Tip: If empty, a beautiful high-res photo matching your vegetable category will be automatically provided.
                        </small>
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
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Publishing Produce...' : '🌿 List Produce for Neighbors'}
                    </button>
                </form>
            </div>
            <ToastContainer />
        </div>
    );
}

export default AddProduce;
