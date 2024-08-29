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
            try {
                console.log('Join chat requested:', { senderId, receiverId });
                
                // Step 1: Identify or create the chat document using clientId and lawyerId
                let chat = await Chat.findOne({ 
                    $or: [
                        { client: senderId, lawyer: receiverId },
                        { client: receiverId, lawyer: senderId }
                    ]
                });
        
                if (!chat) {
                    console.log('Chat not found, creating a new one.');
        
                    // Determine which user is the client and which is the lawyer
                    const sender = await User.findById(senderId).select('type');
                    const receiver = await User.findById(receiverId).select('type');
        
                    if (!sender || !receiver) {
                        console.log('Sender or receiver not found.');
                        return socket.emit('error', 'Invalid user details');
                    }
        
                    // Assign client and lawyer based on user types
                    const client = sender.type === 'client' ? senderId : receiverId;
                    const lawyer = sender.type === 'lawyer' ? senderId : receiverId;
        
                    chat = new Chat({
                        client,
                        lawyer,
                        messages: []
                    });
                    await chat.save();
                    console.log('New chat created:', chat._id);
                }
        
                // Emit the chat ID back to the client
                console.log('Emitting chat_id:', chat._id);
                socket.emit('chat_id', chat._id);
        
                // Fetch and structure the chat history
                const chatHistory = await attachUserDetailsToMessages(chat.messages, senderId, receiverId);
        
                // Join the user to the chat room
                const chatRoom = createChatRoom(chat.client, chat.lawyer);
                socket.join(chatRoom);
                console.log(`User joined room: ${chatRoom}`);
        
                // Emit the chat history to the client
                socket.emit('chat_history', chatHistory);
            } catch (error) {
                console.error('Error fetching or creating chat document:', error);
                socket.emit('error', 'Failed to join chat');
            }
        });
        

        socket.on('send_message', async ({ chatId, senderId, content }) => {
            try {
                const chat = await Chat.findById(chatId);

                if (!chat) {
                    return socket.emit('error', 'Chat not found');
                }

                const message = {
                    sender: senderId,
                    content,
                    timestamp: Date.now()
                };
                chat.messages.push(message);
                chat.lastMessageAt = Date.now();
                await chat.save();

                // Attach sender details to the message
                const updatedMessage = await attachUserDetailsToMessage(message);

                const chatRoom = createChatRoom(chat.client, chat.lawyer);
                io.to(chatRoom).emit('receive_message', updatedMessage);
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

function createChatRoom(clientId, lawyerId) {
    return [clientId, lawyerId].sort().join('-');
}

async function attachUserDetailsToMessages(messages, clientId, lawyerId) {
    const updatedMessages = [];
    for (const message of messages) {
        const senderDetails = await User.findById(message.sender).select('username email profilePic');
        const receiverId = message.sender.toString() === clientId.toString() ? lawyerId : clientId;
        const receiverDetails = await User.findById(receiverId).select('username email profilePic');
        updatedMessages.push({
            ...message.toObject(),
            senderDetails,
            receiverDetails
        });
    }
    return updatedMessages;
}

async function attachUserDetailsToMessage(message) {
    const senderDetails = await User.findById(message.sender).select('username email profilePic');
    return {
        ...message,
        senderDetails
    };
}

module.exports = initializeWebSocket;
