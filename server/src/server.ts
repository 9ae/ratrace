import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
const morgan = require('morgan');
import dotenv from 'dotenv';
import { GameService } from './services/GameService';
import { RedisService } from './services/RedisService';
import { ClientEvents } from './types/game';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(helmet());

const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://10.0.1.12:3000'
];

if (process.env.CORS_ORIGIN) {
  allowedOrigins.push(process.env.CORS_ORIGIN);
}

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json());

// Socket.io setup
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST']
  }
});

// Initialize services
const redisService = new RedisService();
const gameService = new GameService(io, redisService);

// Basic health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`✅ Player connected: ${socket.id} at ${new Date().toISOString()}`);

  socket.on(ClientEvents.JOIN_ROOM, async (data) => {
    console.log(`📥 join-room event from ${socket.id}:`, data);
    await gameService.joinRoom(socket, data.username);
  });

  socket.on(ClientEvents.REJOIN_ROOM, async (data) => {
    console.log(`🔄 rejoin-room event from ${socket.id}:`, data);
    await gameService.rejoinRoom(socket, data.username, data.previousSocketId);
  });

  socket.on(ClientEvents.START_GAME, async (data) => {
    console.log(`🎮 start-game event from ${socket.id}:`, data);
    await gameService.startGame(socket, data);
  });

  socket.on(ClientEvents.GET_GAME_STATE, async (data) => {
    console.log(`📋 get-game-state event from ${socket.id}:`, data);
    await gameService.sendGameState(socket, data.roomId);
  });

  socket.on(ClientEvents.START_TYPING, async (data) => {
    console.log(`⌨️ start-typing event from ${socket.id}`);
    await gameService.updateTypingProgress(socket, data);
  });

  socket.on(ClientEvents.DISCONNECT, (reason) => {
    console.log(`❌ Player disconnected: ${socket.id}, reason: ${reason} at ${new Date().toISOString()}`);
    gameService.handleDisconnect(socket);
  });

  socket.on(ClientEvents.ERROR, (error) => {
    console.error(`🚨 Socket error for ${socket.id}:`, error);
  });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await redisService.disconnect();
  httpServer.close(() => {
    process.exit(0);
  });
});