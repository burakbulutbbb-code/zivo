const path = require('path');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 3000;
const app = express();

// Health check
app.get('/', (_req, res) => res.status(200).send('ZIVO server running'));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const queue = [];
const rooms = new Map();
const socketRoom = new Map();
const socketMeta = new Map();

function countryOf(country) {
  return String(country || '').replace(/^\S+\s/, '');
}

function compatible(x, y) {
  if (!y) return false;

  if (x.targetGender !== 'Herkes' && x.targetGender !== y.myGender) return false;
  if (y.targetGender !== 'Herkes' && y.targetGender !== x.myGender) return false;

  const xc = x.country === '🌍 Tüm Dünya' ? null : countryOf(x.country);
  const yc = y.country === '🌍 Tüm Dünya' ? null : countryOf(y.country);

  if (xc && xc !== y.myCountry) return false;
  if (yc && yc !== x.myCountry) return false;

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

  const idx = queue.findIndex(
    id => id !== socketId && compatible(me, socketMeta.get(id))
  );

  if (idx === -1) return;

  const otherId = queue.splice(idx, 1)[0];
  const other = io.sockets.sockets.get(otherId);
  const mine = io.sockets.sockets.get(socketId);

  if (!other || !mine) return;

  const roomId = `${socketId}__${otherId}`;

  mine.join(roomId);
  other.join(roomId);

  rooms.set(roomId, { a: socketId, b: otherId });
  socketRoom.set(socketId, roomId);
  socketRoom.set(otherId, roomId);

  mine.emit('matched', { roomId, initiator: true });
  other.emit('matched', { roomId, initiator: false });
}

io.on('connection', socket => {
  io.emit('online', io.engine.clientsCount);

  socket.on('find', prefs => {
    socketMeta.set(socket.id, prefs || {});
    leaveRoom(socket, true);

    if (!queue.includes(socket.id)) queue.push(socket.id);
    tryMatch(socket.id);
  });

  socket.on('next', () => {
    leaveRoom(socket, true);

    if (socketMeta.has(socket.id)) {
      if (!queue.includes(socket.id)) queue.push(socket.id);
      tryMatch(socket.id);
    }
  });

  socket.on('leave', () => leaveRoom(socket, true));

  socket.on('report', () => {
    console.log(`Rapor: ${socket.id}`);
  });

  ['offer', 'answer', 'ice', 'chat'].forEach(event => {
    socket.on(event, data => {
      const roomId = socketRoom.get(socket.id);
      if (roomId) socket.to(roomId).emit(event, data);
    });
  });

  socket.on('disconnect', () => {
    leaveRoom(socket, true);

    const idx = queue.indexOf(socket.id);
    if (idx !== -1) queue.splice(idx, 1);

    socketMeta.delete(socket.id);
    io.emit('online', io.engine.clientsCount - 1);
  });
});

server.listen(PORT, () => {
  console.log(`ZIVO server running on port ${PORT}`);
});
