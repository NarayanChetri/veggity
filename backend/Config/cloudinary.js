const path = require('path');
const cloudinary = require('cloudinary').v2;

const cleanEnv = (val) => {
    if (!val) return '';
    return String(val).trim().replace(/^["']|["']$/g, '');
};

/**
 * Ensures Cloudinary is configured with latest environment variables
 */
const configureCloudinary = () => {
    // Reload dotenv with override in case .env was edited or updated
    try {
        require('dotenv').config({ path: path.join(__dirname, '..', '.env'), override: true });
    } catch (_) {}

    const cloud_name = cleanEnv(process.env.CLOUDINARY_CLOUD_NAME);
    const api_key = cleanEnv(process.env.CLOUDINARY_API_KEY);
    const api_secret = cleanEnv(process.env.CLOUDINARY_API_SECRET);

    cloudinary.config({
        cloud_name,
        api_key,
        api_secret
    });

    return { cloud_name, api_key, api_secret };
};

// Initial config
configureCloudinary();

/**
 * Checks whether Cloudinary credentials have been provided in the environment
 */
const isCloudinaryConfigured = () => {
    const { cloud_name, api_key, api_secret } = configureCloudinary();
    return Boolean(cloud_name && api_key && api_secret);
};

/**
 * Uploads an image buffer directly to Cloudinary
 * @param {Buffer} buffer - File buffer from multer memoryStorage
 * @param {string} folder - Folder name in Cloudinary
 * @returns {Promise<object>} - Resolves with Cloudinary upload result
 */
const uploadToCloudinary = (buffer, folder = 'veggity_produce') => {
    configureCloudinary(); // Refresh configuration before uploading
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: 'image',
                transformation: [
                    { width: 1200, height: 1200, crop: 'limit' },
                    { quality: 'auto', fetch_format: 'auto' }
                ]
            },
            (error, result) => {
                if (error) {
                    return reject(error);
                }
                resolve(result);
            }
        );
        stream.end(buffer);
    });
};

module.exports = {
    cloudinary,
    isCloudinaryConfigured,
    uploadToCloudinary
};
