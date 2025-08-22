/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameState, GameStatus, ServerEvents, ClientEvents } from '@/types/game';

export function useSocket(serverPath: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [raceFinished, setRaceFinished] = useState(false);
  const [gameResults, setGameResults] = useState<any>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [roomChanged, setRoomChanged] = useState<{ roomId: string, phrase: string } | null>(null);

  useEffect(() => {
    console.log('🔄 useSocket effect running, attempting to connect to:', serverPath);
    const socketInstance = io(serverPath, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 200000,
      forceNew: false // Allow socket reuse
    });

    socketInstance.on(ServerEvents.CONNECT, () => {
      setIsConnected(true);
      console.log('✅ Connected to server:', socketInstance.id);

      // Check for existing session and auto-rejoin
      const savedSession = localStorage.getItem('ratrace-session');
      if (savedSession) {
        try {
          const session = JSON.parse(savedSession);
          console.log('🔄 Found saved session, attempting to rejoin:', session);
          setIsReconnecting(true);

          socketInstance.emit(ClientEvents.REJOIN_ROOM, {
            username: session.username,
            previousSocketId: session.socketId
          });
        } catch (error) {
          console.error('❌ Error parsing saved session:', error);
          localStorage.removeItem('ratrace-session');
        }
      }
    });

    socketInstance.on(ServerEvents.DISCONNECT, (reason) => {
      setIsConnected(false);
      console.log('❌ Disconnected from server, reason:', reason);
    });

    socketInstance.on(ServerEvents.CONNECT_ERROR, (error) => {
      console.error('❌ Connection error:', error);
    });

    // Set up persistent game event listeners
    socketInstance.on(ServerEvents.GAME_STATE, (state: GameState) => {
      console.log('📥 Received game-state event (persistent listener):', state);
      setGameState(state);
      if (state.status === GameStatus.ACTIVE) {
        console.log('🎮 Game is active, setting gameStarted to true');
        setGameStarted(true);
      }
    });

    socketInstance.on(ServerEvents.GAME_STARTED, () => {
      console.log('🎮 Game started (persistent listener)');
      setGameStarted(true);
    });

    socketInstance.on(ServerEvents.RACE_FINISHED, (data) => {
      console.log('🏁 Race finished (persistent listener):', data);
      setRaceFinished(true);
    });

    socketInstance.on(ServerEvents.GAME_ENDED, (data) => {
      console.log('🏆 Game ended (persistent listener):', data);
      setGameResults(data);
      // Clear session when game ends
      localStorage.removeItem('ratrace-session');
    });

    socketInstance.on(ServerEvents.REJOIN_SUCCESS, (data) => {
      console.log('✅ Successfully rejoined room:', data);
      setIsReconnecting(false);
      setGameState(data.gameState);
    });

    socketInstance.on(ServerEvents.REJOIN_FAILED, (error) => {
      console.log('❌ Failed to rejoin room:', error);
      setIsReconnecting(false);
      localStorage.removeItem('ratrace-session');
    });

    socketInstance.on(ServerEvents.WINNER_PROMOTED, (data) => {
      console.log('🏆 Winner promoted:', data);
      // Winner is automatically moved to winner room - no alert needed
    });

    // Handle room changes (when moved to winner room)
    socketInstance.on(ServerEvents.ROOM_JOINED, (data) => {
      if (data.isWinnerRoom) {
        console.log('🏆 Moved to winner room:', data);
        setRoomChanged({ roomId: data.roomId, phrase: data.phrase });
        // Reset game state for new room
        setGameStarted(false);
        setRaceFinished(false);
        setGameResults(null);
      }
    });

    setSocket(socketInstance);

    return () => {
      console.log('🧹 Cleaning up socket connection');
      // Only disconnect on actual unmount, not re-renders
      setTimeout(() => {
        if (socketInstance.connected) {
          console.log('🔌 Actually disconnecting socket');
          socketInstance.removeAllListeners();
          socketInstance.close();
        }
      }, 100);
      setSocket(null);
      setIsConnected(false);
    };
  }, []); // Empty dependency array to prevent re-runs

  const saveSession = (roomId: string, username: string) => {
    if (socket) {
      const session = {
        roomId,
        username,
        socketId: socket.id,
        timestamp: Date.now()
      };
      localStorage.setItem('ratrace-session', JSON.stringify(session));
      console.log('💾 Session saved:', session);
    }
  };

  const clearSession = () => {
    localStorage.removeItem('ratrace-session');
    console.log('🗑️ Session cleared');
  };

  const clearRoomChanged = () => {
    setRoomChanged(null);
  };

  return {
    socket,
    isConnected,
    gameState,
    gameStarted,
    raceFinished,
    gameResults,
    isReconnecting,
    roomChanged,
    setGameState,
    setGameStarted,
    setRaceFinished,
    setGameResults,
    saveSession,
    clearSession,
    clearRoomChanged
  };
}