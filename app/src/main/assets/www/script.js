const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const chatBox = document.getElementById('chat-box');
const loginButton = document.getElementById('login-button');
const logoutButton = document.getElementById('logout-button');

let auth, db;
let currentUser = null;

// Initialize Firebase
if (firebase.apps.length === 0) {
    firebase.initializeApp(firebaseConfig);
}
auth = firebase.auth();
db = firebase.firestore();

// --- Authentication --- 

loginButton.addEventListener('click', async () => {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        await auth.signInWithPopup(provider);
        // User is logged in, UI will update via auth state listener
    } catch (error) {
        console.error("Error signing in with Google:", error);
        alert("Sign-in failed. Please try again.");
    }
});

logoutButton.addEventListener('click', async () => {
    await auth.signOut();
    // UI will update via auth state listener
});

auth.onAuthStateChanged(user => {
    if (user) {
        currentUser = user;
        loginButton.style.display = 'none';
        logoutButton.style.display = 'inline-block';
        messageInput.disabled = false;
        sendButton.disabled = false;
        loadMessages();
    } else {
        currentUser = null;
        loginButton.style.display = 'inline-block';
        logoutButton.style.display = 'none';
        messageInput.disabled = true;
        sendButton.disabled = true;
        chatBox.innerHTML = '<p style="text-align: center; color: #888;">Please log in to chat.</p>';
    }
});

// --- Chat Functionality --- 

async function sendMessage() {
    const messageText = messageInput.value.trim();
    if (!messageText || !currentUser) return;

    const newMessage = {
        text: messageText,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        uid: currentUser.uid,
        displayName: currentUser.displayName || 'User',
        photoURL: currentUser.photoURL || ''
    };

    try {
        await db.collection('messages').add(newMessage);
        messageInput.value = '';
        // AI reply will be handled by the listener
    } catch (error) {
        console.error("Error sending message:", error);
        alert("Failed to send message.");
    }
}

sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

function displayMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    const isSentByCurrentUser = message.uid === (currentUser ? currentUser.uid : null);
    messageElement.classList.add(isSentByCurrentUser ? 'sent' : 'received');

    const avatar = document.createElement('div');
    avatar.classList.add('avatar');
    avatar.textContent = message.displayName ? message.displayName.charAt(0).toUpperCase() : '?';
    if (message.photoURL) {
        avatar.style.backgroundImage = `url(${message.photoURL})`;
        avatar.style.backgroundSize = 'cover';
        avatar.style.backgroundPosition = 'center';
    }

    const messageContent = document.createElement('div');
    messageContent.classList.add('message-content');

    const senderName = document.createElement('div');
    senderName.classList.add('message-sender');
    senderName.textContent = isSentByCurrentUser ? 'You' : (message.displayName || 'Anonymous');

    const messageText = document.createElement('div');
    messageText.classList.add('message-text');
    messageText.textContent = message.text;

    messageContent.appendChild(senderName);
    messageContent.appendChild(messageText);
    messageElement.appendChild(avatar);
    messageElement.appendChild(messageContent);
    chatBox.appendChild(messageElement);

    // Scroll to bottom
    chatBox.scrollTop = chatBox.scrollHeight;
}

async function loadMessages() {
    chatBox.innerHTML = ''; // Clear existing messages
    try {
        const querySnapshot = await db.collection('messages')
            .orderBy('createdAt', 'asc')
            .limit(50) // Load last 50 messages initially
            .get();

        querySnapshot.forEach(doc => {
            displayMessage(doc.data());
        });

        // Set up real-time listener for new messages
        db.collection('messages')
            .orderBy('createdAt', 'desc')
            .limit(1) // Listen for the latest message
            .onSnapshot(snapshot => {
                snapshot.docChanges().forEach(change => {
                    if (change.type === 'added') {
                        const newMessage = change.doc.data();
                        // Avoid re-displaying messages already loaded or sent by current user
                        if (newMessage.uid !== (currentUser ? currentUser.uid : null) && !document.querySelector(`[data-id='${change.doc.id}']`)) {
                            displayMessage(newMessage);
                            // Simulate AI reply after a short delay
                            setTimeout(() => simulateAiReply(newMessage), 1500);
                        }
                    }
                });
            });

    } catch (error) {
        console.error("Error loading messages:", error);
        chatBox.innerHTML = '<p style="text-align: center; color: red;">Failed to load messages.</p>';
    }
}

// --- AI Reply Simulation --- 

const aiResponses = [
    "That's an interesting point! Tell me more.",
    "I'm processing that information. What else is on your mind?",
    "Fascinating! My algorithms are analyzing your input.",
    "Understood. How can I assist you further?",
    "I'm learning from this conversation. Thank you!",
    "Let me think about that for a moment...",
    "Your perspective is valuable.",
    "Indeed, the data suggests a similar conclusion.",
    "I'm here to help. What's next?",
    "That's a complex topic. Let's break it down."
];

function simulateAiReply(originalMessage) {
    if (!currentUser) return; // Don't reply if user is logged out

    const randomIndex = Math.floor(Math.random() * aiResponses.length);
    const aiMessageText = aiResponses[randomIndex];

    const aiMessage = {
        text: aiMessageText,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        uid: 'AI_BOT_ID', // Unique ID for the AI
        displayName: 'D1g AI',
        photoURL: 'https://images.unsplash.com/photo-1511367461989-f008de7299b5?w=800&q=80' // Placeholder AI avatar
    };

    // Add AI message to Firestore
    db.collection('messages').add(aiMessage)
        .then(() => {
            console.log('AI reply sent.');
        })
        .catch(error => {
            console.error("Error sending AI reply:", error);
        });
}

// Initial check for user login state
auth.onAuthStateChanged(user => {
    if (user) {
        currentUser = user;
        loginButton.style.display = 'none';
        logoutButton.style.display = 'inline-block';
        messageInput.disabled = false;
        sendButton.disabled = false;
        loadMessages();
    } else {
        currentUser = null;
        loginButton.style.display = 'inline-block';
        logoutButton.style.display = 'none';
        messageInput.disabled = true;
        sendButton.disabled = true;
        chatBox.innerHTML = '<p style="text-align: center; color: #888;">Please log in to chat.</p>';
    }
});
