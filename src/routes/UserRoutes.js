const express = require('express');
const { signup , login, legalGpt, forgotPassword, resetPassword } = require('../controllers/UserController');
const { upload } = require('../middleware/uploadFile');


const router = express.Router();

router.post('/signup',  upload.fields([
    { name: 'profilePic', maxCount: 1 }, 
    { name: 'degreePic', maxCount: 1 },
]) ,signup);
router.post('/login', login);
router.post('/legalGPT',legalGpt)
router.post('/forgetPassword',forgotPassword)
router.post('/resetPassword', resetPassword)

module.exports = router;
