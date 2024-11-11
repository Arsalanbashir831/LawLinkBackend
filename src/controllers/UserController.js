const { GEMINI_API_KEY, GMAIL_EMAIL, APP_PASS } = require("../Constants");
const bucket = require("../firebaseConfig");
const User = require("../models/User");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { log } = require("console");


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

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
};
const signup = async (req, res) => {
    try {
        const { username, email, password, type, lawyerType } = req.body;
        
        // Handle profile picture upload
        let profilePicUrl = null;
        if (req.files.profilePic) {
            const profilePicFileName = `profilePics/${Date.now()}_${req.files.profilePic[0].originalname}`;
            profilePicUrl = await uploadFileToFirebase(req.files.profilePic[0].buffer, profilePicFileName);
        }

        // Handle degree picture upload for lawyers
        let degreePicUrl = null;
        if (type === 'lawyer') {
            if (!lawyerType) {
                return res.status(400).send({ error: 'Lawyer type is required for lawyers.' });
            }
            if (req.files.degreePic) {
                const degreePicFileName = `degreePics/${Date.now()}_${req.files.degreePic[0].originalname}`;
                degreePicUrl = await uploadFileToFirebase(req.files.degreePic[0].buffer, degreePicFileName);
            }
        }

        // Generate OTP and save user
        const otp = generateOTP();
        const user = new User({
            username,
            email,
            password,
            type,
            lawyerType: type === 'lawyer' ? lawyerType : undefined,
            profilePic: profilePicUrl,
            degreePic: degreePicUrl,
            verified: false,
            otp, // Save OTP for verification
        });

        await user.save();
        const token = await user.generateAuthToken();

        // Send OTP email
        await transporter.sendMail({
            from: GMAIL_EMAIL,
            to: email,
            subject: 'Email Verification OTP',
            text: `Dear ${username}, your OTP for email verification is: ${otp}`,
        });

        const responseObject = {
            user: {
                username: user.username,
                email: user.email,
                type: user.type,
                lawyerType: user.type === 'lawyer' ? user.lawyerType : undefined,
                profilePic: user.profilePic,
                userId: user._id,
                degreePic: user.type === 'lawyer' ? user.degreePic : undefined,
                verified: user.verified,
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
        
        // Find user and verify credentials
        const user = await User.findByCredentials(email, password);
        
        // Check if user is verified
        if (!user.verified) {
            return res.status(403).send({ error: 'Account not verified. Please verify your OTP.' });
        }

        const token = await user.generateAuthToken();
        res.send({
            user: {
                username: user.username,
                email: user.email,
                type: user.type,
                lawyerType: user.type === 'lawyer' ? user.lawyerType : undefined,
                profilePic: user.profilePic,
                userId: user._id,
                verified: user.verified,
            },
            token: user.token,
            deviceInfo: user.tokenDeviceInfo,
            createdAt: user.tokenCreatedAt,
        });
    } catch (error) {
        res.status(400).send({ error: 'Login failed! Check your credentials.' });
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


const updateUserProfile = async (req, res) => {
    try {
        const userId = req.user._id; // Assuming user ID is obtained from authentication middleware
        const { username } = req.body;

        // Check if only username update is requested
        if (req.headers['content-type'] === 'application/json') {
            // Update only the username field
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { username }, // Update only the username field
                { new: true, runValidators: true }
            );

            if (!updatedUser) {
                return res.status(404).json({ error: "User not found" });
            }

            return res.status(200).json({
                message: "Username updated successfully",
                user: {
                    username: updatedUser.username,
                },
            });
        }

        // If Content-Type is not JSON, check for profile picture and degree picture updates
        const updates = {};

        if (req.files?.profilePic) {
            const profilePicFileName = `profilePics/${Date.now()}_${req.files.profilePic[0].originalname}`;
            const profilePicUrl = await uploadFileToFirebase(req.files.profilePic[0].buffer, profilePicFileName);
            updates.profilePic = profilePicUrl;
        }

        if (req.user.type === 'lawyer' && req.files?.degreePic) {
            const degreePicFileName = `degreePics/${Date.now()}_${req.files.degreePic[0].originalname}`;
            const degreePicUrl = await uploadFileToFirebase(req.files.degreePic[0].buffer, degreePicFileName);
            updates.degreePic = degreePicUrl;
        }

        // If updates object is empty (i.e., no profilePic or degreePic), respond with an error
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: "No updates provided" });
        }

        // Perform updates with available fields
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updates,
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ error: "User not found" });
        }

        res.status(200).json({
            message: "Profile updated successfully",
            user: {
                username: updatedUser.username,
                profilePic: updatedUser.profilePic,
                degreePic: updatedUser.degreePic,
            },
        });
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ error: "Failed to update profile" });
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
        // Find user by email and otp
        const user = await User.findOne({ email, otp });
        if (!user) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // Update user's verified status
        user.verified = true;
        user.otp = null; // Clear the OTP after verification
        await user.save();

        res.status(200).json({ message: 'OTP Verified and account is now verified' });
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
    userProfile , updateUserProfile
};
