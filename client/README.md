# RatRace Frontend

Next.js frontend for the RatRace typing game with real-time multiplayer racing.

## Features

- Real-time multiplayer game interface
- WebSocket client with Socket.io
- Responsive design with Tailwind CSS
- TypeScript for type safety
- Live typing feedback and race progress

## Quick Start

### Prerequisites

- Node.js 18+
- Backend server running

### Installation

```bash
npm install
```

### Environment Variables

Create `.env.local`:

```env
API_URL=http://localhost:3001
```

### Development

```bash
npm run dev
```

Visit http://localhost:3000

### Production

```bash
npm run build
npm start
```

## Game Features

- **Join/Create Rooms**: Enter username and room ID (optional)
- **Real-time Typing**: Live progress tracking and WPM calculation
- **Race Visualization**: Animal avatars with progress bars
- **Auto-start**: Games begin when 2+ players join

## Components

- `GameLobby` - Room joining interface
- `RaceGame` - Main game interface with typing area
- `useSocket` - WebSocket connection hook

## Deployment

### Vercel (Recommended)
1. Connect GitHub repository
2. Set `API_URL` environment variable
3. Deploy automatically

### Render
1. Create new Static Site
2. Build Command: `npm install && npm run build`
3. Publish Directory: `out`
4. Set environment variables

### Netlify
1. Connect repository
2. Build Command: `npm run build`
3. Publish Directory: `.next`
