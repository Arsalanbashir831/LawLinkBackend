const express = require('express');
const { 
    signup , 
    login, 
    legalGpt,
    forgotPassword,
    resetPassword,
    userProfile,
    otpVerification , updateUserProfile,sendMailForQuery
} = require('../controllers/UserController');
const { upload } = require('../middleware/uploadFile');
const verifyToken = require('../middleware/verifyToken');


const router = express.Router();

router.post('/signup',  upload.fields([
    { name: 'profilePic', maxCount: 1 }, 
    { name: 'degreePic', maxCount: 1 },
]) ,signup);

router.post('/update-profile', verifyToken, updateUserProfile);
router.post('/login', login);
router.post('/legalGPT',legalGpt);
router.post('/forgetPassword',forgotPassword);
router.post('/resetPassword', resetPassword);
router.post('/verifyOtp', otpVerification);
router.post('/query',sendMailForQuery)
router.get('/userProfile',verifyToken, userProfile);



module.exports = router;
