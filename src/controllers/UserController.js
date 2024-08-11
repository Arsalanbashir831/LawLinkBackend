const User = require("../models/User");

const signup = async (req, res) => {
    try {
        const user = new User(req.body);
        await user.save();
        const token = await user.generateAuthToken();
        res.status(201).send({
            user: {
                username: user.username,
                email: user.email,
                type: user.type,
                profilePic: user.profilePic,
            },
            token: user.token,
            deviceInfo: user.tokenDeviceInfo,
            createdAt: user.tokenCreatedAt,
        });
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
            },
            token: user.token,
            deviceInfo: user.tokenDeviceInfo,
            createdAt: user.tokenCreatedAt,
        });
    } catch (error) {
        res.status(400).send({ error: 'Login failed! Check your credentials' });
    }
};

module.exports = {
    signup,
    login,
};
