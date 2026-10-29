const multer = require('multer');

// Store files in memory buffer for streaming to Cloudinary
const storage = multer.memoryStorage();

// Validate file type (allow common image formats & camera snapshots)
const fileFilter = (req, file, cb) => {
    const isImageMime = file.mimetype && file.mimetype.toLowerCase().startsWith('image/');
    const hasImageExt = file.originalname && /\.(jpe?g|png|webp|gif|heic|heif|bmp|tiff?)$/i.test(file.originalname);

    if (isImageMime || hasImageExt) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Please upload a valid image (JPEG, PNG, WEBP, or GIF).'), false);
    }
};

const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10 MB max limit for modern smartphone camera photos
    },
    fileFilter
});

// Middleware wrapper to catch multer errors cleanly and return JSON responses
const handleImageUpload = (fieldName = 'image') => {
    const uploadSingle = upload.single(fieldName);

    return (req, res, next) => {
        uploadSingle(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({
                        success: false,
                        message: 'File size too large. Maximum allowed size is 10MB.'
                    });
                }
                return res.status(400).json({
                    success: false,
                    message: `Upload error: ${err.message}`
                });
            } else if (err) {
                return res.status(400).json({
                    success: false,
                    message: err.message || 'Error uploading file'
                });
            }
            next();
        });
    };
};

module.exports = {
    handleImageUpload
};

