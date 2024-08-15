const { Server } = require('socket.io');
const Chat = require('./models/Chat');
const User = require('./models/User');

function initializeWebSocket(server) {
    const io = new Server(server, {
        cors: {
            origin: '*',
        },
    });

    io.on('connection', (socket) => {
        console.log('A user connected:', socket.id);

        socket.on('join_chat', async ({ senderId, receiverId }) => {
            const chatRoom = createChatRoom(senderId, receiverId);
            socket.join(chatRoom);
            console.log(`User joined room: ${chatRoom}`);
        
            try {
                const chat = await Chat.findOne({ 
                    $or: [
                        { client: senderId, lawyer: receiverId },
                        { client: receiverId, lawyer: senderId }
                    ]
                });
        
                if (chat) {
                    const chatHistory = await Promise.all(chat.messages.map(async (message) => {
                        const senderDetails = await User.findById(message.sender).select('username email profilePic');
                        const receiverDetails = await User.findById(message.sender === senderId ? receiverId : senderId).select('username email profilePic');
                        
                        return {
                            senderId: message.sender,
                            senderDetails: senderDetails ? senderDetails.toObject() : null,
                            receiverId: message.sender === senderId ? receiverId : senderId,
                            receiverDetails: receiverDetails ? receiverDetails.toObject() : null,
                            content: message.content,
                            timestamp: message.timestamp
                        };
                    }));
        
                    socket.emit('chat_history', chatHistory);
                } else {
                    socket.emit('chat_history', []); // No chat history
                }
            } catch (error) {
                console.error('Error fetching chat history:', error);
                socket.emit('error', 'Failed to load chat history');
            }
        });
        

        socket.on('send_message', async ({ senderId, receiverId, content }) => {
            const chatRoom = createChatRoom(senderId, receiverId);
            try {
                let chat = await Chat.findOne({ 
                    $or: [
                        { client: senderId, lawyer: receiverId },
                        { client: receiverId, lawyer: senderId }
                    ]
                });

                if (!chat) {
                    chat = new Chat({
                        client: senderId,
                        lawyer: receiverId,
                        messages: []
                    });
                }

                const sender = await User.findById(senderId).select('username email profilePic');
                const message = {
                    sender: senderId,
                    content,
                    senderDetails: sender,
                };
                chat.messages.push(message);
                chat.lastMessageAt = Date.now();
                await chat.save();

                io.to(chatRoom).emit('receive_message', message);
            } catch (error) {
                console.error('Error sending message:', error);
                socket.emit('error', 'Failed to send message');
            }
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });

    return io;
}

function createChatRoom(senderId, receiverId) {
    
    return [senderId, receiverId].sort().join('-');
}


async function attachUserDetailsToMessages(messages) {
    const updatedMessages = [];
    for (const message of messages) {
        const senderDetails = await User.findById(message.sender).select('username email profilePic');
        updatedMessages.push({
            ...message,
            senderDetails
        });
    }
    return updatedMessages;
}

module.exports = initializeWebSocket;
