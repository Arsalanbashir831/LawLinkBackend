const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const { MONGODB_URL, WS_PORT } = require('./Constants');
const Chat = require('./models/Chat'); // Import your Chat model
const User = require('./models/User'); // Import your User model

const server = http.createServer(); // Create an HTTP server for Socket.io
const io = socketIo(server);

const mongoURI = `${MONGODB_URL}`;
mongoose.connect(mongoURI)
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch((err) => {
        console.error('Error connecting to MongoDB:', err);
    });

// Socket.io middleware to authenticate and attach user to socket
io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    try {
        const user = await User.findByToken(token); // Assuming you have a findByToken method
        if (!user) throw new Error('Authentication error');
        socket.user = user;
        next();
    } catch (err) {
        next(new Error('Authentication error'));
    }
});

io.on('connection', (socket) => {
    console.log(`User ${socket.user.username} connected`);

    socket.on('join', (chatId) => {
        socket.join(chatId); // User joins a specific chat room
    });

    socket.on('message', async ({ chatId, content }) => {
        const message = {
            sender: socket.user._id,
            content,
            timestamp: new Date(),
        };

        await Chat.findByIdAndUpdate(chatId, {
            $push: { messages: message },
            lastMessageAt: message.timestamp,
        });

        io.to(chatId).emit('message', message); // Emit message to everyone in the chat
    });

    socket.on('disconnect', () => {
        console.log(`User ${socket.user.username} disconnected`);
    });
});

const port = WS_PORT || 3001;
server.listen(port, () => {
    console.log(`WebSocket server listening on port ${port}`);
});
