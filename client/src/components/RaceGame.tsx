'use client';

import { useState, useEffect, useRef } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { GameStatus, ClientEvents } from '@/types/game';

interface RaceGameProps {
  roomId: string;
  phrase: string;
  onLeaveGame: () => void;
}

export default function RaceGame({ roomId, phrase, onLeaveGame }: RaceGameProps) {
  const [currentInput, setCurrentInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { socket, gameState, gameStarted, raceFinished, isReconnecting, isConnected } = useSocket();

  console.log('🎯 RaceGame render - gameState:', gameState);
  console.log('🎯 RaceGame render - gameStarted:', gameStarted);

  useEffect(() => {
    if (gameStarted && inputRef.current) {
      inputRef.current.focus();
    }
  }, [gameStarted]);

  useEffect(() => {
    // Request game state when component mounts and socket is ready
    if (socket && !gameState) {
      console.log('🔄 RaceGame requesting game state for room:', roomId);
      socket.emit(ClientEvents.GET_GAME_STATE, { roomId });
    }
  }, [socket, gameState, roomId]);

  const handleStartGame = () => {
    if (!socket || !gameState) {
      console.error('❌ Cannot start game - socket or gameState missing', { socket: !!socket, gameState: !!gameState });
      return;
    }
    console.log('🚀 Starting game for room:', gameState.roomId);
    console.log('📤 Emitting start-game event');
    socket.emit(ClientEvents.START_GAME, { roomId: gameState.roomId });
  };

  const handleInputChange = (value: string) => {
    if (!gameStarted || raceFinished) return;

    if (value.length <= phrase.length && phrase.startsWith(value)) {
      setCurrentInput(value);

      if (socket) {
        socket.emit(ClientEvents.START_TYPING, {
          playerId: socket.id,
          currentText: value,
          position: (value.length / phrase.length) * 100
        });
      }

      // Race finished state is now handled globally in socket hook
    }
  };

  const getCharacterClass = (index: number) => {
    if (index < currentInput.length) {
      return currentInput[index] === phrase[index] ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';
    }
    if (index === currentInput.length) {
      return 'bg-blue-200';
    }
    return 'text-gray-600';
  };

  const animals = ['🐰', '🐢', '🐎', '🦆', '🐱', '🐶', '🐺', '🦊'];

  if (!gameState) {
    return (
      <div className="bg-white rounded-lg shadow-2xl p-6">
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Room: {roomId}</h2>
          {isReconnecting ? (
            <>
              <p className="text-yellow-600">Reconnecting to game...</p>
              <div className="mt-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto"></div>
              </div>
            </>
          ) : !isConnected ? (
            <>
              <p className="text-red-600">Connection lost...</p>
              <div className="mt-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
              </div>
            </>
          ) : (
            <>
              <p className="text-gray-600">Loading game state...</p>
              <div className="mt-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-2xl p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Room: {roomId}
          </h2>
          {gameState && (
            <div className="mt-2">
              <p className="text-sm text-gray-600 font-medium">
                Players ({gameState.players.length}/8):
              </p>
              <div className="flex flex-wrap gap-2 mt-1">
                {gameState.players.map((player, index) => (
                  <span
                    key={player.id}
                    className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs flex items-center gap-1"
                  >
                    <span>{animals[index % 8]}</span>
                    {player.username}
                    {player.finished && <span className="text-green-600">✓</span>}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        {gameState?.status === GameStatus.WAITING && (

          <button
            onClick={handleStartGame}
            disabled={!socket || !gameState || gameState.players.length < 1}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium text-lg mb-6"
          >
            Start Game
          </button>
        )}

        <button
          onClick={onLeaveGame}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          Leave Game
        </button>
      </div>
      {gameState && (
        <>
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-xl font-mono leading-relaxed">
              {phrase.split('').map((char, index) => (
                <span key={index} className={`${getCharacterClass(index)} px-0.5 py-1 rounded`}>
                  {char}
                </span>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <input
              ref={inputRef}
              type="text"
              value={currentInput}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder={gameStarted ? "Start typing..." : "Get ready..."}
              className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              disabled={!gameStarted || raceFinished}
            />
            <div className="text-xs text-gray-500 mt-1">
              Debug: gameStarted={gameStarted.toString()}, raceFinished={raceFinished.toString()}, disabled={(!gameStarted || raceFinished).toString()}
            </div>
          </div>

          {gameState?.players && gameState.players.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Race Progress</h3>
              {gameState.players.map((player, index) => (
                <div key={player.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-2xl">{animals[index % animals.length]}</span>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium">{player.username}</span>
                      <span className="text-sm text-gray-600">
                        {player.wpm} WPM | {player.accuracy}% accuracy
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-300 ${player.finished ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                        style={{ width: `${Math.min(player.position, 100)}%` }}
                      />
                    </div>
                  </div>
                  {player.finished && (
                    <span className="text-green-600 font-bold">✓ Finished!</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}