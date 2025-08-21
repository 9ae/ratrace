'use client';

import { useState } from 'react';
import { useSocket } from '@/hooks/useSocket';

interface GameLobbyProps {
  onJoinGame: (roomId: string, phrase: string) => void;
}

export default function GameLobby({ onJoinGame }: GameLobbyProps) {
  const [username, setUsername] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const { socket, isConnected, saveSession } = useSocket();

  const handleJoinRoom = async () => {
    if (!socket || !username.trim()) return;

    setIsJoining(true);

    socket.emit('join-room', {
      username: username.trim()
    });

    socket.once('room-joined', (data) => {
      console.log('📥 Room joined, requesting current game state');
      // Save session for reconnection
      saveSession(data.roomId, username.trim());
      // Request current game state since RaceGame component isn't mounted yet
      socket.emit('get-game-state', { roomId: data.roomId });
      onJoinGame(data.roomId, data.phrase);
      setIsJoining(false);
    });

    socket.once('room-full', () => {
      alert('Room is full! Try another room.');
      setIsJoining(false);
    });

    socket.once('error', (error) => {
      alert(`Error: ${error}`);
      setIsJoining(false);
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Join the Race</h2>
        <div className="flex items-center justify-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-gray-600">
            {isConnected ? 'Connected' : 'Connecting...'}
          </span>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleJoinRoom(); }} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            maxLength={20}
          />
        </div>


        <button
          type="submit"
          disabled={!isConnected || !username.trim() || isJoining}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isJoining ? 'Joining...' : 'Join Race'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          🎮 Automatically matched with up to 8 players<br />
          🏃‍♂️ Type phrases to power your animal<br />
          🏆 First to finish wins!
        </p>
      </div>
    </div>
  );
}