// ZIVO eşleştirme + sinyalleşme sunucusu + WEB istemcisi (hepsi tek yerden)
const path = require('path');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.static(path.join(__dirname, '..', 'web')));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Bekleme kuyruğu
const queue = [];
const rooms = new Map();      // roomId -> { a, b }
const socketRoom = new Map(); // socketId -> roomId
const socketMeta = new Map(); // socketId -> prefs

function countryOf(flagCountry) {
  // "🇹🇷 Türkiye" -> "Türkiye"
  return flagCountry.replace(/^\S+\s/, '');
}

function compatible(x, y) {
  if (x.targetGender !== 'Herkes' && x.targetGender !== y.myGender) return false;
  if (y.targetGender !== 'Herkes' && y.targetGender !== x.myGender) return false;
  const xTarget = x.country === '🌍 Tüm Dünya' ? null : countryOf(x.country);
  const yTarget = y.country === '🌍 Tüm Dünya' ? null : countryOf(y.country);
  if (xTarget && xTarget !== y.myCountry) return false;
  if (yTarget && yTarget !== x.myCountry) return false;
  return true;
}

function tryMatch(socketId) {
  const me = socketMeta.get(socketId);
  if (!me) return;
  const idx = queue.findIndex((id) => id !== socketId && compatible(me, socketMeta.get(id)));
  if (idx === -1) return;

  const otherId = queue.splice(idx, 1)[0];
  const other = io.sockets.sockets.get(otherId);
  const meSocket = io.sockets.sockets.get(socketId);
  if (!other || !meSocket) return;

  const roomId = `${socketId}__${otherId}`;
  meSocket.join(roomId);
  other.join(roomId);
  rooms.set(roomId, { a: socketId, b: otherId });
  socketRoom.set(socketId, roomId);
  socketRoom.set(otherId, roomId);

  meSocket.emit('matched', { roomId, initiator: true });
  other.emit('matched', { roomId, initiator: false });
}

function leaveRoom(socket, notifyOther) {
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

function broadcastOnline() {
  io.emit('online', io.engine.clientsCount);
}

io.on('connection', (socket) => {
  broadcastOnline();

  socket.on('find', (prefs) => {
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
    console.log(`Rapor: ${socket.id} (oda: ${socketRoom.get(socket.id)})`);
    // TODO: raporları veritabanına yaz, eşik aşılınca IP'yi engelle
  });

  ['offer', 'answer', 'ice', 'chat'].forEach((event) => {
    socket.on(event, (data) => {
      const roomId = socketRoom.get(socket.id);
      if (roomId) socket.to(roomId).emit(event, data);
    });
  });

  socket.on('disconnect', () => {
    leaveRoom(socket, true);
    const qi = queue.indexOf(socket.id);
    if (qi !== -1) queue.splice(qi, 1);
    socketMeta.delete(socket.id);
    broadcastOnline();
  });
});

server.listen(PORT, () => {
  console.log(`ZIVO sunucusu çalışıyor: port ${PORT}`);
});
