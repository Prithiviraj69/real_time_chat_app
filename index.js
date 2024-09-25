// index.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const crypto = require('crypto');

dotenv.config(); // Load environment variables

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));
app.use(express.json());
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');
    next();
});


const messages = [];
const verifiedUsers = new Set();
const verificationTokens = {}; // Store tokens with expiry time

// Email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Route to render the username page
app.get('/', (req, res) => {
    res.render('username');
});

// Route to render the chat page
app.get('/chat', (req, res) => {
    const username = req.query.username;

    // Check if the username is in the verified users set
    if (!verifiedUsers.has(username)) {
        return res.redirect('/'); // If not verified, redirect to the username page
    }

    res.render('chat');
});

// Route for email verification
app.get('/verify', (req, res) => {
    const token = req.query.token;
    const tokenData = verificationTokens[token];

    if (tokenData && Date.now() < tokenData.expires) {
        // Token is valid and within the expiry time
        const username = tokenData.username;
        verifiedUsers.add(username); // Add user to verified set

        delete verificationTokens[token]; // Immediately invalidate the token after use
        res.redirect(`/chat?username=${username}`); // Pass username via query string
    } else {
        // Token is invalid (either expired or used)
        res.status(400).send('Verification link is invalid or has expired.');
    }
});

// Send verification email
app.post('/send-verification', (req, res) => {
    const { username, email } = req.body;

    if (!username || username.length <= 4) {
        return res.status(400).json({ success: false, message: 'Username must be more than 4 characters.' });
    }

    const token = crypto.randomBytes(16).toString('hex'); // Generate a unique token
    verificationTokens[token] = { username, expires: Date.now() + 3 * 60 * 1000 }; // Set 3 minutes expiry

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Email Verification',
        text: `Hello ${username},\n\nPlease verify your email by clicking the link below. This link will expire in 3 minutes and can only be used once.\n\nhttp://localhost:3000/verify?token=${token}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            return res.status(500).json({ success: false, message: 'Failed to send email.' });
        }
        res.json({ success: true });
    });
});

// Handle Socket.IO connections
// Server-side socket handling
// Server-side socket handling
io.on('connection', (socket) => {
    console.log('A user connected');

    // Send existing messages to the newly connected user
    messages.forEach(msg => socket.emit('chat message', msg));

    // Listen for incoming messages
    socket.on('chat message', (data) => {
        if (verifiedUsers.has(data.username)) {
            messages.push(data);
            io.emit('chat message', data); // Broadcast message to all clients
        } else {
            socket.emit('error', { message: 'You must be verified to send messages.' });
        }
    });

    // Handle logout event
    socket.on('logout', (data) => {
        console.log(`${data.username} has logged out.`);
        verifiedUsers.delete(data.username); // Remove user from verified set
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});



const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
