const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../Constants');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
    },
    profilePic: {
        type: String,
    },
    cnicFront: {
        type: String,
    },
    cnicBack: {
        type: String,
    },
    degreePic: {
        type: String,
        required: function () {
            return this.type === 'lawyer';
        },
    },
    type: {
        type: String,
        enum: ['lawyer', 'client'],
        required: true,
    },
    token: {
        type: String,
    },
    tokenCreatedAt: {
        type: Date,
    },
    tokenDeviceInfo: {
        type: String,
    }
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    const user = this;
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8);
    }
    next();
});

// Generate Auth Token
userSchema.methods.generateAuthToken = async function () {
    const user = this;
    const token = jwt.sign({ _id: user._id.toString(), type: user.type }, SECRET_KEY);
    user.token = token;
    user.tokenCreatedAt = Date.now();
    user.tokenDeviceInfo = 'Device info'; // Replace with actual device info if needed
    await user.save();
    return token;
};

// Find user by credentials
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email });
    if (!user) {
        throw new Error('Unable to login');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new Error('Unable to login');
    }

    return user;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
