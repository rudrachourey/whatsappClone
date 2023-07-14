var io = require('socket.io')();
const socketapi = {
  io: io,
};

const formatMessage = require('./services/messages');
// const {userJoin,getCurrentUser,userLeave, getRoomUsers, newRoom, rooms} = require('./services/users');

/*Craete an empty object to collect connected users*/
var connectedUsers = {};

const users = {}; // Map of user IDs to socket IDs

// Run when client connectsw
io.on('connection', (socket) => {
  console.log('Connect');

  /////////////////PRIVATE CHAT //////////////////////
  socket.on('register', function (user) {
    users[user.id] = socket.id;
    console.log(`User ${user.id} connected with socket ID ${socket.id}`);

    // console.log(users[user.id]);
  });

  // Handle incoming messages
  socket.on('pmessage', (data) => {
    if (currentRoom) {
      socket.leave(currentRoom);
    }
    const { user, to, message, ringtone } = data;

    // Find the socket ID of the recipient

    const recipientSocketId = users[to.id];

    if (socket.currentRoom) {
      socket.leave(socket.currentRoom);
    }

    // Join the new private room
    const privateRoom = `private:${user.id}:${to.id}`;
    socket.join(privateRoom);
    socket.currentRoom = privateRoom;

    console.log(`${user.username} joined private chat with ${to.username}`);

    console.log(recipientSocketId, 'send private message too');

    io.to(recipientSocketId).emit('pmessage', {data:formatMessage(user.username, message), user,ringtone});
  });

  socket.on('privateVideoCallEmit', (data) => {
    if (currentRoom) {
      socket.leave(currentRoom);
    }
    const { user, to, randomPrivateId } = data;

    // Find the socket ID of the recipient

    const recipientSocketId = users[to.id];

    if (socket.currentRoom) {
      socket.leave(socket.currentRoom);
    }

    // Join the new private room
    const privateRoom = `private:${user.id}:${to.id}`;
    socket.join(privateRoom);
    socket.currentRoom = privateRoom;

    // console.log(`${user.username} joined private chat with ${to.username}`);

    // console.log(recipientSocketId, 'send private message too');
    // Send the message to the recipient
    io.to(recipientSocketId).emit('privateVideoCallEmit', {
      user,
      to,
      randomPrivateId,
    });
  });

  // Handle disconnecting from private chat
  socket.on('leavePrivateChat', () => {
    if (socket.currentRoom) {
      socket.leave(socket.currentRoom);
      console.log(`${socket.username} left the private chat`);
    }
  });

  // socket.on("leavePrivateChat", (userId) => {
  //     const socketId = users[userId];
  //     socket.leave(socketId);
  //     console.log(`User ${userId} left the chat`);
  //   });

  //////////////////////PRIVATE CHAT//////////////

  ///send msg to everyone connected
  let currentRoom;
  socket.on('joinRoom', ({ user, joinedRoom, lastRoom }) => {
    console.log(user, joinedRoom, lastRoom);
    socket.broadcast.to(lastRoom.roomID).emit('leaving', `${user.username} left this group`);
    socket.broadcast.to(lastRoom.roomId).emit('message', `${user.username} LEFT THIS GROUP`);

    console.log(lastRoom, 'LEFT...');

    // Leave the old room, if any
    if (currentRoom) {
      socket.leave(currentRoom);
    }
    // console.log(user,joinedRoom, "NEW ROOM JOINING.........................................................")

    ///////////USRR JOIN ROOM ////////////////////////////////
    socket.join(joinedRoom.roomId);

    currentRoom = joinedRoom.roomId;
    console.log(joinedRoom, 'JOINED...');

    ///// BROADCAST A USER JOIN MESSAGE

    socket.emit('message', `You joined ${joinedRoom.roomName} group`);
    socket.broadcast.to(joinedRoom.roomId).emit('message', `${user.username} joined this group`);
  });

  socket.on('videoCall', ({ User, joinedRoom }) => {
    // console.log(User, joinedRoom);

    socket.broadcast.to(joinedRoom.roomId).emit('videoCall', { User, joinedRoom });
  });

  socket.on('chat', ({ joinedRoom, ringtone }) => {
    console.log(joinedRoom, '///////////////////////');
    // console.log(user)
     socket.broadcast.to(joinedRoom.roomId).emit('chat', (ringtone));
  });

  /////for typing purposes
  socket.on('typing', (data) => {
    socket.broadcast.emit('typing', data);
  });

  ////////////////////////////PRIVATE CHAT

  socket.on('disconnect', () => {
    const userId = Object.keys(users).find((key) => users[key] === socket.id);
    if (userId) {
      console.log(`User ${userId} disconnected`);
      delete users[userId];
    }
  });
});

// end of socket.io logic

module.exports = socketapi;
