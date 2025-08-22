'use client';

import { useState, useEffect, useRef } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { GameStatus, ClientEvents, RoomType } from '@/types/game';

interface RaceGameProps {
  roomId: string;
  phrase: string;
  onLeaveGame: () => void;
}

export default function RaceGame({ roomId, phrase: initialPhrase, onLeaveGame }: RaceGameProps) {
  const [currentInput, setCurrentInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { socket, gameState, gameStarted, raceFinished, isReconnecting, isConnected } = useSocket();

  // Use phrase from gameState if available, otherwise use initial phrase
  const currentPhrase = gameState?.phrase || initialPhrase;
  // Use room ID from gameState if available, otherwise use initial room ID
  const currentRoomId = gameState?.roomId || roomId;

  useEffect(() => {
    if (gameStarted && inputRef.current) {
      inputRef.current.focus();
    }
  }, [gameStarted]);

  // Reset typing state when phrase changes (e.g., moved to winner room)
  useEffect(() => {
    if (currentPhrase !== initialPhrase) {
      console.log('🔄 Phrase changed, resetting typing state');
      setCurrentInput('');
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }, [currentPhrase, initialPhrase]);

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

    if (value.length <= currentPhrase.length && currentPhrase.startsWith(value)) {
      setCurrentInput(value);

      if (socket) {
        socket.emit(ClientEvents.START_TYPING, {
          playerId: socket.id,
          currentText: value,
          position: (value.length / currentPhrase.length) * 100
        });
      }

      // Race finished state is now handled globally in socket hook
    }
  };

  const getCharacterClass = (index: number) => {
    if (index < currentInput.length) {
      return currentInput[index] === currentPhrase[index] ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';
    }
    if (index === currentInput.length) {
      return 'bg-blue-200';
    }
    return 'text-gray-600';
  };

  const animals = ['🐇', '🐢', '🐎', '🪿', '🐒', '🐩', '🐏', '🐿️'];

  if (!gameState) {
    return (
      <div className="bg-white rounded-lg shadow-2xl p-6">
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Room: {currentRoomId}</h2>
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
            Room: {currentRoomId}
            {gameState?.roomType === RoomType.WINNER && (
              <span className="ml-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                🏆 Winner Room
              </span>
            )}
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
                    {player.finished && (
                      player.rank === 1 ? (
                        <span className="text-yellow-600">🏆</span>
                      ) : (
                        <span className="text-green-600">✓</span>
                      )
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-4 mb-6">
          {gameState?.status === GameStatus.WAITING && (
            <button
              onClick={handleStartGame}
              disabled={!socket || !gameState || gameState.players.length < 1}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium text-lg"
            >
              Start Game
            </button>
          )}

          <button
            onClick={onLeaveGame}
            className="flex-1 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium text-lg"
          >
            Leave Game
          </button>
        </div>
      </div>
      {gameState && (
        <>
          <div className={`mb-6 p-4 bg-gray-50 rounded-lg ${gameStarted ? 'visible' : 'invisible'}`}>
            <div className="text-xl font-mono leading-relaxed">
              {currentPhrase.split('').map((char: string, index: number) => (
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
              className="w-full px-4 py-3 text-lg text-black border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              disabled={!gameStarted || raceFinished}
            />
          </div>

          {gameState?.players && gameState.players.length > 0 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Race Track</h3>

              {/* Race Track */}
              <div className="relative bg-green-700 rounded-lg p-4 min-h-[200px]">
                {/* Start Line */}
                <div className="absolute left-4 top-0 bottom-0 w-1 bg-gray-400 flex items-center">
                  <span className="absolute -left-8 text-xs font-bold text-gray-600 transform -rotate-90 whitespace-nowrap">START</span>
                </div>

                {/* Finish Line */}
                <div className="absolute right-4 top-0 bottom-0 w-1 bg-black flex items-center">
                  <span className="absolute -right-8 text-xs font-bold text-gray-900 transform -rotate-90 whitespace-nowrap">FINISH</span>
                </div>

                {/* Track Lanes */}
                <div className="flex flex-col h-full min-h-[160px]">
                  {gameState.players.map((player, index) => (
                    <div key={player.id} className="relative flex items-center h-8 border-b-2 border-white last:border-b-0">
                      {/* Lane background */}
                      <div className="absolute inset-0 bg-green-600 opacity-30"></div>

                      {/* Player emoji moving across track */}
                      <div
                        className="absolute flex items-center transition-all duration-300 ease-out"
                        style={{
                          left: `${Math.max(5, Math.min(player.position * 0.85 + 5, 90))}%`,
                          transform: 'translateX(-50%)'
                        }}
                      >
                        <span className={`text-2xl ${player.finished ? 'animate-bounce' : ''}`}
                          style={{
                            transform: 'scaleX(-1)'
                          }}>
                          {animals[index % animals.length]}
                        </span>
                        {player.finished && player.rank === 1 && (
                          <span className="text-lg ml-1">🏆</span>
                        )}
                      </div>

                      {/* Player info tooltip on hover */}
                      <div className="absolute left-0 top-10 bg-white px-2 py-1 rounded shadow-md text-xs opacity-0 hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                        {player.username}: {player.wpm} WPM | {player.accuracy}% accuracy
                        {player.finished && <span className="text-green-600 ml-1">✓ Finished!</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Player Stats Table */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold mb-3">Player Statistics</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  {gameState.players.map((player, index) => (
                    <div key={player.id} className="flex items-center justify-between p-2 bg-white rounded">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{animals[index % animals.length]}</span>
                        <span className="font-medium">{player.username}</span>
                        {player.finished && (
                          player.rank === 1 ? (
                            <span className="text-yellow-600">🏆</span>
                          ) : (
                            <span className="text-green-600">✓</span>
                          )
                        )}
                      </div>
                      <div className="text-gray-600">
                        {player.wpm} WPM | {player.accuracy}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}