const jwt = require('jsonwebtoken');
const User = require('../models/User'); 
const { SECRET_KEY } = require('../Constants');

const verifyToken = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        if (!token) {
            return res.status(401).send({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, SECRET_KEY);
        const user = await User.findOne({ _id: decoded._id, token });
        if (!user) {
            return res.status(401).send({ error: 'Invalid token' });
        }
        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        console.error('Token verification failed:', error);
        res.status(401).send({ error: 'Please authenticate' });
    }
};

module.exports = verifyToken;
