const http = require('http');
const express = require('express');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 3000;
const app = express();
app.get('/', (_req, res) => res.status(200).send('ZIVO server is running'));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
const queue = [];
const rooms = new Map();
const socketRoom = new Map();
const socketMeta = new Map();

function countryOf(value) {
  return String(value || '').replace(/^\S+\s/, '');
}

function compatible(a, b) {
  if (!a || !b) return false;
  if (a.targetGender && a.targetGender !== 'Herkes' && a.targetGender !== b.myGender) return false;
  if (b.targetGender && b.targetGender !== 'Herkes' && b.targetGender !== a.myGender) return false;
  const aCountry = a.country === '🌍 Tüm Dünya' ? null : countryOf(a.country);
  const bCountry = b.country === '🌍 Tüm Dünya' ? null : countryOf(b.country);
  if (aCountry && aCountry !== b.myCountry) return false;
  if (bCountry && bCountry !== a.myCountry) return false;
  return true;
}

function leaveRoom(socket, notifyOther = true) {
  const roomId = socketRoom.get(socket.id);
  if (!roomId) return;
  const room = rooms.get(roomId);
  if (room) {
    const otherId = room.a === socket.id ? room.b : room.a;
    const other = io.sockets.sockets.get(otherId);
    if (other) {
      other.leave(roomId);
      socketRoom.delete(otherId);
      if (notifyOther) other.emit('peer-left');
    }
    rooms.delete(roomId);
  }
  socket.leave(roomId);
  socketRoom.delete(socket.id);
}

function tryMatch(socketId) {
  const me = socketMeta.get(socketId);
  if (!me) return;
  const index = queue.findIndex(id => id !== socketId && compatible(me, socketMeta.get(id)));
  if (index < 0) return;
  const otherId = queue.splice(index, 1)[0];
  const other = io.sockets.sockets.get(otherId);
  const current = io.sockets.sockets.get(socketId);
  if (!other || !current) return;
  const roomId = `${socketId}__${otherId}`;
  current.join(roomId);
  other.join(roomId);
  rooms.set(roomId, { a: socketId, b: otherId });
  socketRoom.set(socketId, roomId);
  socketRoom.set(otherId, roomId);
  current.emit('matched', { roomId, initiator: true });
  other.emit('matched', { roomId, initiator: false });
}

function broadcastOnline() {
  io.emit('online', io.engine.clientsCount);
}

io.on('connection', socket => {
  broadcastOnline();
  socket.on('find', prefs => {
    socketMeta.set(socket.id, prefs || {});
    leaveRoom(socket);
    if (!queue.includes(socket.id)) queue.push(socket.id);
    tryMatch(socket.id);
  });
  socket.on('next', () => {
    leaveRoom(socket);
    if (socketMeta.has(socket.id)) {
      if (!queue.includes(socket.id)) queue.push(socket.id);
      tryMatch(socket.id);
    }
  });
  socket.on('leave', () => {
    leaveRoom(socket);
    const index = queue.indexOf(socket.id);
    if (index !== -1) queue.splice(index, 1);
  });
  socket.on('report', () => console.log(`Report received from ${socket.id}`));
  ['offer', 'answer', 'ice', 'chat'].forEach(event => {
    socket.on(event, data => {
      const roomId = socketRoom.get(socket.id);
      if (roomId) socket.to(roomId).emit(event, data);
    });
  });
  socket.on('disconnect', () => {
    leaveRoom(socket);
    const index = queue.indexOf(socket.id);
    if (index !== -1) queue.splice(index, 1);
    socketMeta.delete(socket.id);
    broadcastOnline();
  });
});

server.listen(PORT, () => console.log(`ZIVO server running on port ${PORT}`));
