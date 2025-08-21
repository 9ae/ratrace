# RatRace Backend

WebSocket-based racing game server built with Express.js, Socket.io, and Redis.

## Features

- Real-time multiplayer racing (up to 8 players per room)
- WebSocket communication with Socket.io
- Redis for session management and caching
- TypeScript for type safety
- Auto-scaling game rooms

## Quick Start

### Prerequisites

- Node.js 18+
- Redis server

### Installation

```bash
npm install
cp .env.example .env
```

### Environment Variables

```env
PORT=3001
REDIS_URL=redis://localhost:6379
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

### Start redis first
brew services start redis

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

## API Endpoints

- `GET /health` - Health check

## WebSocket Events

### Client → Server
- `join-room` - Join or create a game room
- `start-typing` - Send typing progress

### Server → Client
- `room-joined` - Successfully joined room
- `game-state` - Current game state
- `game-started` - Race has begun
- `race-finished` - Player finished race
- `game-ended` - All players finished

## Deployment

### Railway
1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically

### Render
1. Create new Web Service
2. Build Command: `npm install && npm run build`
3. Start Command: `npm start`
4. Add Redis add-on

### AWS/GCP
- Use provided Docker configuration
- Set up Redis ElastiCache/Memorystore
- Configure load balancer for multiple instances