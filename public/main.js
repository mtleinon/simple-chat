// Define references to elements in DOM accessed from Javascript
const socket = io.connect();
const chat = document.getElementById('chat');
const container = document.getElementById('container');
const users = document.getElementById('users');
const username = document.getElementById('username');
const currentUser = document.getElementById('current-user');
const loginForm = document.getElementById('login-form');
const usersList = document.getElementById('users-list');
const message = document.getElementById('message');
const messages = document.getElementById('messages');
const messageForm = document.getElementById('message-form');
const messageLabel = document.getElementById('message-label');
const errorMessage = document.getElementById('error-message');
const joinButton = document.getElementById('join-button');
const messageButton = document.getElementById('message-button');

// Submit a new chat message to server and set form ready for
// the user to start writing a new chat message
messageForm.onsubmit = e => {
  e.preventDefault();
  console.log('submitted', message.value);
  socket.emit('send message', message.value);

  message.value = '';
  messageButton.innerText = 'Enter message first';
  messageButton.disabled = true;
  message.focus();
};

// User wrote a new character to message form. Notify server about it
// and if the message is valid, enable send message button.
message.onkeyup = e => {
  console.log('message.onkeyup', e);
  socket.emit('typing');
  if (message.value.trim() === '') {
    messageButton.disabled = true;
    messageButton.innerText = 'Enter message first';
  } else {
    messageButton.disabled = false;
    messageButton.innerText = 'Send message';
  }
};

// If username is valid, join new user to the chat by sending
// user name to the server. Hide login screen and show chat screen
const joinToChat = () => {
  if (!validateUsername(username.value)) {
    return;
  }
  socket.emit('new user', username.value);
  currentUser.innerText = username.value;

  chat.classList.toggle('chat--hidden');
  messageForm.classList.toggle('message-form--hidden');
  loginForm.classList.toggle('login-form--hidden');
  message.focus();
};

loginForm.onsubmit = e => {
  e.preventDefault();
  joinToChat();
};

// Validate username by checking that it is not empty
// and that the username is free.
const validateUsername = username => {
  if (username.trim() === '') {
    errorMessage.innerText = 'Please give username first!';
    joinButton.innerText = 'Give username first';
    return false;
  }
  if (document.getElementById(username)) {
    errorMessage.innerText = '"' + username + '" username is already taken.';
    joinButton.innerText = 'Give username first';
    return false;
  }
  return true;
};

// When user presses a key in username input, validate the
// username. If usrname is valid activate join button
// If enter key was pressed, join user to chat.
username.onkeyup = e => {
  if (validateUsername(username.value)) {
    joinButton.innerText = 'Join to chat';
    errorMessage.innerText = '';
    joinButton.disabled = false;
    if (e.keyCode === 13) {
      joinToChat();
    }
  } else {
    joinButton.disabled = true;
  }
};

// Server was restarted and it requests client's
// username, reply to it by sending username written
// to the unsername input.
socket.on('get username', () => {
  socket.emit('current user', username.value);
});

// Some other client sent a new chat message through server.
// Add it as an uppermost message.
socket.on('new message', data => {
  messages.insertAdjacentHTML(
    'afterbegin',
    `<article class="chat__message">
            <div class="user">${data.username}</div>
            <div class="speech-bubble">${data.msg}</div>
          </article>`
  );
  document.getElementById(data.username).classList.remove('user--is-typing');
});

// Server notified that some user is typing. Show it by adding
// 'user--is-typing' class for the user element.
socket.on('username is typing', data => {
  document.getElementById(data.username).classList.add('user--is-typing');
});

// A new user joined to the chat and server send all users
// in an array. Regenerate users in .users aside element:
socket.on('current users', data => {
  let html = '<h2 class="users__title">Users in chat:</h2>';
  data.msg.forEach(user => {
    html += `<div id="${user}"class='user'>${user}</div>`;
  });
  users.innerHTML = '';
  users.insertAdjacentHTML('beforeend', html);
});
