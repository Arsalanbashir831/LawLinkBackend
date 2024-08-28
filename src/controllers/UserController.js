const { GEMINI_API_KEY, GMAIL_EMAIL, APP_PASS } = require("../Constants");
const bucket = require("../firebaseConfig");
const User = require("../models/User");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const nodemailer = require('nodemailer');
const crypto = require('crypto');


const uploadFileToFirebase = async (fileBuffer, fileName) => {
    const file = bucket.file(fileName);
    await file.save(fileBuffer, {
        contentType: 'image/jpeg', 
        metadata: {
            cacheControl: 'public, max-age=31536000',
        },
    });
    const [url] = await file.getSignedUrl({
        action: 'read',
        expires: '03-09-2491', 
    });
    return url;
};

const transporter = nodemailer.createTransport({
    service: 'gmail',
    secure:true,
    port:465,
    auth: {
        user: GMAIL_EMAIL, // Replace with your Gmail address
        pass: APP_PASS, // Replace with your App Password
    },
});
const signup = async (req, res) => {
    try {
        const { username, email, password, type } = req.body;
        let profilePicUrl = null;
        if (req.files.profilePic) {
            const profilePicFileName = `profilePics/${Date.now()}_${req.files.profilePic[0].originalname}`;
            profilePicUrl = await uploadFileToFirebase(req.files.profilePic[0].buffer, profilePicFileName);
        }

        let degreePicUrl = null;
        if (type === 'lawyer' && req.files.degreePic) {
            const degreePicFileName = `degreePics/${Date.now()}_${req.files.degreePic[0].originalname}`;
            degreePicUrl = await uploadFileToFirebase(req.files.degreePic[0].buffer, degreePicFileName);
        }

        const user = new User({
            username,
            email,
            password,
            type,
            profilePic: profilePicUrl,
            degreePic: degreePicUrl, 
        });

        await user.save();
        const token = await user.generateAuthToken();

        const responseObject = {
            user: {
                username: user.username,
                email: user.email,
                type: user.type,
                profilePic: user.profilePic,
                userId:user._id,
                degreePic: user.type === 'lawyer' ? user.degreePic : undefined,
            },
            token: user.token,
            deviceInfo: user.tokenDeviceInfo,
            createdAt: user.tokenCreatedAt,
        };

        res.status(201).send(responseObject);
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
};


const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findByCredentials(email, password);
        const token = await user.generateAuthToken();
        res.send({
            user: {
                username: user.username,
                email: user.email,
                type: user.type,
                profilePic: user.profilePic,
                userId:user._id
            },
            token: user.token,
            deviceInfo: user.tokenDeviceInfo,
            createdAt: user.tokenCreatedAt,
        });
    } catch (error) {
        res.status(400).send({ error: 'Login failed! Check your credentials' });
    }
};

const legalGpt = async (req, res) => {
    try {
        if (!req.body || !req.body.textPrompt) {
            return res.status(400).send({ error: 'textPrompt is required' });
        }

        const { textPrompt } = req.body;
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        try {
            const result = await model.generateContent(textPrompt);
            const response = await result.response;
            const text = await response.text();

            res.status(200).send({
                prompt: textPrompt,
                response: text
            });
        } catch (apiError) {
            console.error('API Error:', apiError);
            res.status(500).send({ error: 'Failed to generate content' });
        }
    } catch (error) {
        console.error('Unexpected Error:', error);
        res.status(500).send({ error: 'An unexpected error occurred' });
    }
};


const userProfile = async (req, res) => {
    const userId = req.user._id;
    try {
        const user = await User.findById(userId).select('-password'); 
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ user });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'An error occurred while fetching the user profile', error });
    }
};


const forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).send({ message: 'User not found' });
        }
        const otp = crypto.randomInt(100000, 999999).toString();
        user.otp = otp;
        await user.save();
        await transporter.sendMail({
            from: GMAIL_EMAIL,
            to: user.email,
            subject: 'Password Reset OTP',
            text: `Your OTP for password reset is: ${otp}`,
        });

        res.send({ message: 'OTP sent to your email' });
    } catch (error) {
        console.log(error);
        res.status(500).send({ message: 'An error occurred', error }); 
    }
};

const resetPassword = async (req, res) => {
    const { email, newPassword } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).send({ message: 'Invalid email' });
        }
        user.password = newPassword;
        user.otp = undefined; 
        await user.save();

        res.send({ message: 'Password reset successful' });
    } catch (error) {
        console.log(error);
        
        res.status(500).send({ message: 'An error occurred', error });
    }
};
const otpVerification = async (req, res) => {
    const { email, otp } = req.body;
    try {
        const user = await User.findOne({ email, otp });
        if (!user) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }
        res.status(200).json({ message: 'OTP Verified' });
    } catch (error) {
        console.error('Error during OTP verification:', error);
        res.status(500).json({ message: 'An error occurred', error });
    }
};


module.exports = {
    signup,
    login,
    legalGpt,
    resetPassword,
    forgotPassword, 
    otpVerification,
    userProfile
};
