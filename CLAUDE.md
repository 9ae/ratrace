# RatRace Typing Game - Project Context

## Project Overview
A real-time multiplayer typing racing game where players type phrases to power their animal avatars in a race. Supports 100-200 concurrent users.

## Architecture Implemented

### Backend (`ratrace-backend`)
- **Framework**: Node.js + Express.js + TypeScript
- **Real-time**: Socket.io for WebSocket communication
- **Database**: Redis for session management and caching
- **Structure**: Modular with services, controllers, types, utils
- **Features**:
  - Up to 8 players per room
  - Real-time WPM and accuracy calculation
  - Auto-start games when 2+ players join
  - Graceful disconnection handling
  - Room management and player rankings

### Frontend (`ratrace-frontend`)
- **Framework**: Next.js 15 + TypeScript + Tailwind CSS
- **Real-time**: Socket.io client
- **Features**:
  - Responsive game lobby for joining/creating rooms
  - Real-time typing interface with character feedback
  - Live race progress with animal avatars
  - Player statistics display (WPM, accuracy, rankings)

## Key Game Mechanics
1. Players join rooms with username (room ID optional)
2. Game auto-starts with 2+ players after 3-second countdown
3. Players type given phrases character-by-character
4. Typing speed powers animal movement in race
5. Real-time progress updates every keystroke
6. First to complete phrase wins

## Deployment Strategy
- **Backend**: Railway, Render, or AWS with Redis add-on
- **Frontend**: Vercel (recommended), Netlify, or Render
- **Scaling**: Horizontal scaling with load balancer for 100-200 users
- **Cost**: ~$150-300/month for AWS, or free tiers for testing

## WebSocket Events
- Client → Server: `join-room`, `start-typing`
- Server → Client: `room-joined`, `game-state`, `game-started`, `race-finished`, `game-ended`

## Development Commands
- **Backend**: `npm run dev` (nodemon + ts-node)
- **Frontend**: `npm run dev` (Next.js dev server)
- **Build**: `npm run build` for both projects

## Repository Structure
```
ratrace/
├── ratrace-backend/     # Express + Socket.io + Redis
└── ratrace-frontend/    # Next.js + TypeScript + Tailwind
```

Both repositories include comprehensive README files with setup and deployment instructions.