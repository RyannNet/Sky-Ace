import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Serve static files from the build directory
app.use(express.static(join(__dirname, 'dist')));

// Store connected players: { [socketId]: { x, y, z, qx, qy, qz, qw, skin, name } }
const players = {};

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  // Handle player joining the game world
  socket.on('join', (userData) => {
    players[socket.id] = {
      id: socket.id,
      ...userData,
      x: 0, y: 0, z: 0, // Initial safe pos
      qx: 0, qy: 0, qz: 0, qw: 1
    };
    
    // Send existing players to the new joiner
    socket.emit('currentPlayers', players);
    
    // Broadcast new player to everyone else
    socket.broadcast.emit('playerJoined', players[socket.id]);
  });

  // Handle movement updates
  socket.on('updateMovement', (data) => {
    if (players[socket.id]) {
      players[socket.id] = { ...players[socket.id], ...data };
      // Broadcast movement to others (exclude sender)
      socket.broadcast.emit('playerMoved', { id: socket.id, data });
    }
  });

  // --- VOICE CHAT SIGNALING ---
  socket.on('voice-signal', ({ to, signal }) => {
    io.to(to).emit('voice-signal', {
      from: socket.id,
      signal
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    delete players[socket.id];
    io.emit('playerLeft', socket.id);
  });
});

// Handle any requests that don't match the above
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});