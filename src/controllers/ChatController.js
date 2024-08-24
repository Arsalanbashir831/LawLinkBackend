const Chat = require('../models/Chat');
const User = require('../models/User');



const getChats = async (req, res) => {
    try {
        const userId = req.user._id;
        const userType = req.user.type;
        console.log(userId, userType);

        // Determine which field to populate based on userType
        const populateField = userType === 'lawyer' ? 'client' : 'lawyer';

        // Find all chats involving this user
        const chats = await Chat.find({
            $or: [
                { client: userId },
                { lawyer: userId }
            ]
        }).populate(populateField, 'username email profilePic');

        // Extract the list of users (either clients or lawyers) from the chat
        const users = chats.map(chat => {
            return userType === 'lawyer' ? chat.client : chat.lawyer;
        });

        res.status(200).send({ users });
    } catch (error) {
        console.error('Error fetching chats:', error);
        res.status(500).send({ error: 'Failed to fetch chats' });
    }
};

module.exports = {
    getChats,
};


module.exports = {
    getChats,
};
