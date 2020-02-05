const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io').listen(server);
const users = [];
const port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log('listening port', port);
});

// Send chat client to browser
app.use(express.static(__dirname + '/public'));
app.get('/', function (_, res) {
  res.sendFile(__dirname + '/index.html');
});

// Wait socket IO connections in the server
io.on('connection', socket => {
  console.log(`Connected ${socket.id}: ${users.length} users currently`);

  // Send all logged in users to clients
  const updateUserNames = () => {
    io.sockets.emit('current users', { msg: users });
  };

  // Disconnect client from server and remove user from logged in users array.
  socket.on('disconnect', reason => {
    console.log(
      `disconnected: ${socket.id}, username: ${
      socket.username
      }, reason ${reason}`
    );

    if (!socket.username) return;
    users.splice(users.indexOf(socket.username), 1);
    updateUserNames();
    console.log(`Disconnected: ${users.length} users currently`);
  });

  // A user sent a message, sent it to all users
  socket.on('send message', data => {
    console.log(
      `send message: ${socket.id}, user: ${socket.username}, data: ${data}`
    );
    io.sockets.emit('new message', { username: socket.username, msg: data });
  });

  // a user is typing, sent user's username to all users
  socket.on('typing', () => {
    console.log(`typing: ${socket.id}, user: ${socket.username}`);
    io.sockets.emit('username is typing', { username: socket.username });
  });

  // a new user logged in. Add username to users array and sent array to all clients
  socket.on('new user', data => {
    console.log(`new user: ${socket.id}: data: ${data}`);
    socket.username = data;
    users.push(socket.username);
    updateUserNames();
  });

  // client replied to server's get current username request. Store username
  // and send updated username array to all clients.
  socket.on('current user', data => {
    console.log(`current user: ${socket.id}: data: ${data}`);
    if (!data) return;
    socket.username = data;
    users.push(socket.username);
    updateUserNames();
  });

  // When server is restarted all clients reopen the connections to server.
  // However server has lost all usernames stored to users array.
  // To get client's username server sends 'get username' request to client.
  socket.emit('get username');

  // Send all logged in users to the new client.
  updateUserNames();
});
