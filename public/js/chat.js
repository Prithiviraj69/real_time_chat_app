// Check if the user is logged in (by checking localStorage)
window.addEventListener('load', () => {
    const username = localStorage.getItem('username');

    // If there's no username stored, redirect to the username page
    if (!username) {
        window.location.href = '/';
    }

    // Load messages from localStorage (if you are saving chat history locally)
    const storedMessages = JSON.parse(localStorage.getItem('chatMessages')) || [];
    storedMessages.forEach(addMessageToChat);
});

const socket = io(); // Initialize Socket.IO

const messageInput = document.getElementById('message');
const sendButton = document.getElementById('send');
const messagesContainer = document.getElementById('messages');
const logoutButton = document.getElementById('logout'); // New logout button

// Get the username from the query parameter or session
const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get('username');

if (!username) {
    // If the username is not available, redirect back to the username entry page
    alert("Username is not available. Redirecting to homepage.");
    window.location.href = '/';
}

// Listen for incoming messages and display them
socket.on('chat message', (data) => {
    addMessageToChat(data);
});

// Function to add messages to the chat
function addMessageToChat(data) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message';
    messageElement.textContent = `@${data.username}: ${data.message}`;
    messagesContainer.appendChild(messageElement);
    
    // Scroll to the bottom of the chat container
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Handle sending messages
sendButton.addEventListener('click', () => {
    const message = messageInput.value.trim();
    
    if (message) {
        socket.emit('chat message', { username, message }); // Send username and message
        messageInput.value = ''; // Clear input field after sending
    } else {
        alert("Message cannot be empty");
    }
});

// Handle pressing Enter to send a message
messageInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        sendButton.click(); // Trigger click on send button
    }
});

// Handle logout
logoutButton.addEventListener('click', () => {
    localStorage.removeItem('chatMessages'); // Clear messages from localStorage
    localStorage.removeItem('username'); // Clear username from localStorage (if stored)

    socket.emit('logout', { username });

    // Redirect to the homepage after logout
    window.location.href = '/';
});
