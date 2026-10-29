const path = require('path');
// Ensure environment variables are loaded even if imported early
if (!process.env.CLOUDINARY_CLOUD_NAME) {
    require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
}

const cloudinary = require('cloudinary').v2;

/**
 * Ensures Cloudinary is configured with latest environment variables
 */
const configureCloudinary = () => {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
};

// Initial config
configureCloudinary();

/**
 * Checks whether Cloudinary credentials have been provided in the environment
 */
const isCloudinaryConfigured = () => {
    return Boolean(
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
    );
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
