const multer = require('multer');

// Store files in memory buffer for streaming to Cloudinary
const storage = multer.memoryStorage();

// Validate file type (only allow common image formats)
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/gif',
        'image/heic',
        'image/heif'
    ];

    if (allowedMimeTypes.includes(file.mimetype.toLowerCase())) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, WEBP, and GIF images are allowed.'), false);
    }
};

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5 MB max limit
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
                        message: 'File size too large. Maximum allowed size is 5MB.'
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

