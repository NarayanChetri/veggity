const { signupValidation, loginValidation } = require('../Middlewares/AuthValidation');
const router = require('express').Router();
const { signup, login, getProfile } = require('../Controllers/AuthController');
const ensureAuthenticated = require('../Middlewares/EnsureAuth');

router.post('/login', loginValidation, login);
router.post('/signup', signupValidation, signup);
router.get('/profile', ensureAuthenticated, getProfile);

module.exports = router;
