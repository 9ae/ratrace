'use client';

import { useState, useEffect } from 'react';
import GameLobby from '@/components/GameLobby';
import RaceGame from '@/components/RaceGame';
import { useSocket } from '@/hooks/useSocket';

export default function Home() {
  const [currentView, setCurrentView] = useState<'lobby' | 'game'>('lobby');
  const [gameData, setGameData] = useState<{ roomId: string; phrase: string } | null>(null);
  const { roomChanged, clearRoomChanged } = useSocket();

  const handleJoinGame = (roomId: string, phrase: string) => {
    setGameData({ roomId, phrase });
    setCurrentView('game');
  };

  const handleLeaveGame = () => {
    setCurrentView('lobby');
    setGameData(null);
  };

  // Handle room changes (when moved to winner room)
  useEffect(() => {
    if (roomChanged && currentView === 'game') {
      console.log('🔄 Updating game data for new room:', roomChanged);
      setGameData({ roomId: roomChanged.roomId, phrase: roomChanged.phrase });
      clearRoomChanged();
    }
  }, [roomChanged, currentView, clearRoomChanged]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-4">
      <div className="container mx-auto">
        <header className="text-center py-8">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-2">
            🏁 RatRace
          </h1>
          <p className="text-xl text-blue-100">
            Type fast, race faster!
          </p>
        </header>

        <main className="max-w-4xl mx-auto">
          {currentView === 'lobby' && (
            <GameLobby onJoinGame={handleJoinGame} />
          )}
          
          {currentView === 'game' && gameData && (
            <RaceGame
              roomId={gameData.roomId}
              phrase={gameData.phrase}
              onLeaveGame={handleLeaveGame}
            />
          )}
        </main>
      </div>
    </div>
  );
}
