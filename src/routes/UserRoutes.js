const express = require('express');
const { 
    signup , 
    login, 
    legalGpt,
    forgotPassword,
    resetPassword,
    userProfile,
    otpVerification 
} = require('../controllers/UserController');
const { upload } = require('../middleware/uploadFile');
const verifyToken = require('../middleware/verifyToken');


const router = express.Router();

router.post('/signup',  upload.fields([
    { name: 'profilePic', maxCount: 1 }, 
    { name: 'degreePic', maxCount: 1 },
]) ,signup);
router.post('/login', login);
router.post('/legalGPT',legalGpt);
router.post('/forgetPassword',forgotPassword);
router.post('/resetPassword', resetPassword);
router.post('/verifyOtp', otpVerification);
router.get('/userProfile',verifyToken, userProfile);

module.exports = router;
