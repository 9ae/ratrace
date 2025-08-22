import { Server, Socket } from 'socket.io';
import { GameRoom, Player, TypingProgress, GameStatus, ServerEvents, RoomType } from '../types/game';
import { RedisService } from './RedisService';
import { generatePhrase, calculateWPM, calculateAccuracy } from '../utils/gameUtils';

export class GameService {
  private rooms: Map<string, GameRoom> = new Map();
  private playerRooms: Map<string, string> = new Map();

  constructor(
    private io: Server,
    private redisService: RedisService
  ) { }

  private findAvailableRoom(roomType: RoomType = RoomType.REGULAR): string {
    // Different numbering schemes for different room types
    const prefix = roomType === RoomType.WINNER ? 'W' : '';
    let roomNumber = 1;
    
    while (true) {
      const roomId = `${prefix}${roomNumber}`;
      const room = this.rooms.get(roomId);
      
      // If room doesn't exist or has space and is waiting for players
      if (!room || (room.players.size < room.maxPlayers && room.status === GameStatus.WAITING && room.type === roomType)) {
        return roomId;
      }
      
      roomNumber++;
    }
  }

  async joinRoom(socket: Socket, username: string) {
    console.log(`Player ${username} is trying to join a room`);
    try {
      // Find available room or create a new one
      const roomId = this.findAvailableRoom();
      console.log(`Assigning player ${username} to room ${roomId}`);
      
      let room = this.rooms.get(roomId);

      if (!room) {
        console.log(`Room ${roomId} not found, creating new room`);
        room = {
          id: roomId,
          players: new Map(),
          phrase: generatePhrase(),
          status: GameStatus.WAITING,
          maxPlayers: 8,
          type: RoomType.REGULAR
        };
        this.rooms.set(roomId, room);
        console.log(`Created new room ${roomId} with phrase: ${room.phrase}`);
      } else {
        console.log(`Found existing room ${roomId} with ${room.players.size} players`);
      }

      console.log(`Creating player object for ${username} with socket ID ${socket.id}`);
      const player: Player = {
        id: socket.id,
        username,
        position: 0,
        wpm: 0,
        accuracy: 100,
        currentCharIndex: 0,
        finished: false
      };

      console.log(`Adding player ${username} to room ${roomId}`);
      room.players.set(socket.id, player);
      this.playerRooms.set(socket.id, roomId);
      console.log(`✅ Player ${username} (${socket.id}) added to room ${roomId}. Room now has ${room.players.size} players`);
      console.log(`👥 Current players in room:`, Array.from(room.players.values()).map(p => `${p.username}(${p.id})`));

      console.log(`Player ${username} joining socket room ${roomId}`);
      socket.join(roomId);

      console.log(`Emitting room-joined event to ${username}`);
      socket.emit(ServerEvents.ROOM_JOINED, { roomId, phrase: room.phrase });

      console.log(`Broadcasting game state for room ${roomId}`);
      this.broadcastGameState(roomId);
      console.log(`Successfully completed join room process for ${username} in room ${roomId}`);

    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit(ServerEvents.ERROR, 'Failed to join room');
    }
  }

  async rejoinRoom(socket: Socket, username: string, previousSocketId?: string) {
    console.log(`🔄 Player ${username} attempting to rejoin a room (previous socket: ${previousSocketId})`);
    
    try {
      // For rejoin, try to find the player's previous room first
      let roomId = null;
      let room = null;
      
      // Search for the player in existing rooms if previousSocketId is provided
      if (previousSocketId) {
        for (const [id, gameRoom] of this.rooms) {
          if (gameRoom.players.has(previousSocketId)) {
            roomId = id;
            room = gameRoom;
            break;
          }
        }
      }
      
      // If no previous room found, assign to available room
      if (!room) {
        roomId = this.findAvailableRoom();
        room = this.rooms.get(roomId);
        
        if (!room) {
          console.log(`Room ${roomId} not found, creating new room for rejoin`);
          room = {
            id: roomId,
            players: new Map(),
            phrase: generatePhrase(),
            status: GameStatus.WAITING,
            maxPlayers: 8,
            type: RoomType.REGULAR
          };
          this.rooms.set(roomId, room);
        }
      }

      // Check if the previous player exists and update their socket ID
      let existingPlayer = null;
      if (previousSocketId) {
        existingPlayer = room.players.get(previousSocketId);
        if (existingPlayer) {
          console.log(`🔄 Found existing player ${username}, updating socket ID from ${previousSocketId} to ${socket.id}`);
          // Remove old socket ID entry and add with new socket ID
          room.players.delete(previousSocketId);
          existingPlayer.id = socket.id;
          room.players.set(socket.id, existingPlayer);
          this.playerRooms.set(socket.id, roomId!);
          
          // Clean up old player room mapping if it exists
          this.playerRooms.delete(previousSocketId);
        }
      }

      // If no existing player found, create a new one (same as regular join)
      if (!existingPlayer) {
        console.log(`🆕 No existing player found, creating new player for ${username}`);
        const player = {
          id: socket.id,
          username,
          position: 0,
          wpm: 0,
          accuracy: 100,
          currentCharIndex: 0,
          finished: false
        };
        room.players.set(socket.id, player);
        this.playerRooms.set(socket.id, roomId!);
      }

      socket.join(roomId!);
      
      console.log(`✅ Player ${username} successfully rejoined room ${roomId}. Room now has ${room.players.size} players`);
      
      // Send current game state
      const gameState = {
        roomId: roomId!,
        players: Array.from(room.players.values()),
        phrase: room.phrase,
        status: room.status,
        timeRemaining: room.startTime ? Math.max(0, 120000 - (Date.now() - room.startTime)) : undefined,
        roomType: room.type
      };
      
      socket.emit(ServerEvents.REJOIN_SUCCESS, { gameState });
      this.broadcastGameState(roomId!);
      
    } catch (error) {
      console.error('Error rejoining room:', error);
      socket.emit(ServerEvents.REJOIN_FAILED, 'Failed to rejoin room');
    }
  }

  async sendGameState(socket: Socket, roomId: string) {
    console.log(`📋 Sending game state for room ${roomId} to socket ${socket.id}`);
    const room = this.rooms.get(roomId);
    
    if (!room) {
      console.error(`❌ Room ${roomId} not found when sending game state`);
      socket.emit(ServerEvents.ERROR, 'Room not found');
      return;
    }

    const gameState = {
      roomId,
      players: Array.from(room.players.values()),
      phrase: room.phrase,
      status: room.status,
      timeRemaining: room.startTime ? Math.max(0, 120000 - (Date.now() - room.startTime)) : undefined,
      roomType: room.type
    };

    console.log(`📤 Sending game-state to socket ${socket.id}:`, gameState);
    socket.emit(ServerEvents.GAME_STATE, gameState);
  }

  async startGame(socket: Socket, data: { roomId: string }) {
    const roomId = data.roomId;
    console.log(`🎮 startGame called for room ${roomId} by socket ${socket.id}`);
    console.log(`🏠 Available rooms:`, Array.from(this.rooms.keys()));
    console.log(`👤 Player rooms map:`, Object.fromEntries(this.playerRooms));
    
    const room = this.rooms.get(roomId);

    if (!room) {
      console.error(`❌ Room ${roomId} not found! Available rooms: ${Array.from(this.rooms.keys()).join(', ')}`);
      socket.emit(ServerEvents.ERROR, 'Room not found');
      return;
    }

    if (room.status !== GameStatus.WAITING) {
      socket.emit(ServerEvents.ERROR, 'Game already started or finished');
      return;
    }

    if (room.players.size < 1) {
      socket.emit(ServerEvents.ERROR, 'Need at least 1 player to start');
      return;
    }

    this.startGameInternal(roomId);
  }

  async updateTypingProgress(socket: Socket, data: TypingProgress) {
    const roomId = this.playerRooms.get(socket.id);
    if (!roomId) return;

    const room = this.rooms.get(roomId);
    if (!room || room.status !== GameStatus.ACTIVE) return;

    const player = room.players.get(socket.id);
    if (!player || player.finished) return;

    const { currentText } = data;
    const phrase = room.phrase;

    player.currentCharIndex = currentText.length;
    player.position = (currentText.length / phrase.length) * 100;
    player.wpm = calculateWPM(currentText, room.startTime!);
    player.accuracy = calculateAccuracy(currentText, phrase.slice(0, currentText.length));

    // Check if player finished
    if (currentText === phrase) {
      player.finished = true;
      player.finishTime = Date.now();
      socket.emit(ServerEvents.RACE_FINISHED, { position: this.getPlayerRank(roomId, socket.id) });
    }

    this.broadcastGameState(roomId);

    // Check if all players finished
    const allFinished = Array.from(room.players.values()).every(p => p.finished);
    if (allFinished) {
      room.status = GameStatus.FINISHED;
      this.endGame(roomId);
    }
  }

  private startGameInternal(roomId: string) {
    console.log(`Starting game in room ${roomId}`);
    const room = this.rooms.get(roomId);
    console.log(room);
    if (!room) return;

    room.status = GameStatus.ACTIVE;
    room.startTime = Date.now();

    this.io.to(roomId).emit(ServerEvents.GAME_STARTED, { startTime: room.startTime });
    this.broadcastGameState(roomId);
  }

  private endGame(roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const results = Array.from(room.players.values())
      .sort((a, b) => (a.finishTime || Infinity) - (b.finishTime || Infinity))
      .map((player, index) => ({
        ...player,
        rank: index + 1
      }));

    this.io.to(roomId).emit(ServerEvents.GAME_ENDED, { results });

    // Move winner to winner room after a short delay
    if (results.length > 0 && results[0].rank === 1) {
      const winner = results[0];
      setTimeout(() => {
        this.moveWinnerToWinnerRoom(winner);
      }, 5000); // Give 5 seconds to see results
    }

    // Clean up room after 30 seconds
    setTimeout(() => {
      this.cleanupRoom(roomId);
    }, 30000);
  }

  private broadcastGameState(roomId: string) {
    console.log(`📡 Broadcasting game state for room ${roomId}`);
    const room = this.rooms.get(roomId);
    if (!room) {
      console.error(`❌ Room ${roomId} not found when broadcasting game state`);
      return;
    }

    const gameState = {
      roomId,
      players: Array.from(room.players.values()),
      phrase: room.phrase,
      status: room.status,
      timeRemaining: room.startTime ? Math.max(0, 120000 - (Date.now() - room.startTime)) : undefined,
      roomType: room.type
    };

    console.log(`📤 Emitting game-state to room ${roomId}:`, gameState);
    console.log(`👥 Room has ${room.players.size} players:`, Array.from(room.players.keys()));
    
    this.io.to(roomId).emit(ServerEvents.GAME_STATE, gameState);
    console.log(`✅ game-state event sent to room ${roomId}`);
  }

  private getPlayerRank(roomId: string, playerId: string): number {
    const room = this.rooms.get(roomId);
    if (!room) return 0;

    const finishedPlayers = Array.from(room.players.values())
      .filter(p => p.finished)
      .sort((a, b) => (a.finishTime || 0) - (b.finishTime || 0));

    return finishedPlayers.findIndex(p => p.id === playerId) + 1;
  }

  handleDisconnect(socket: Socket) {
    const roomId = this.playerRooms.get(socket.id);
    console.log(`🔌 handleDisconnect for socket ${socket.id}, roomId: ${roomId}`);
    
    if (!roomId) return;

    const room = this.rooms.get(roomId);
    if (room) {
      console.log(`👥 Removing player ${socket.id} from room ${roomId}. Players before removal: ${room.players.size}`);
      room.players.delete(socket.id);
      console.log(`👥 Players after removal: ${room.players.size}`);
      
      this.broadcastGameState(roomId);

      if (room.players.size === 0) {
        console.log(`🧹 Room ${roomId} is now empty, scheduling cleanup in 10 seconds`);
        // Give some time for reconnection before cleanup
        setTimeout(() => {
          const currentRoom = this.rooms.get(roomId);
          if (currentRoom && currentRoom.players.size === 0) {
            console.log(`🗑️ Room ${roomId} still empty after 10 seconds, cleaning up`);
            this.cleanupRoom(roomId);
          } else {
            console.log(`✅ Room ${roomId} has players again, skipping cleanup`);
          }
        }, 10000);
      }
    }

    this.playerRooms.delete(socket.id);
  }

  private moveWinnerToWinnerRoom(winner: Player) {
    console.log(`🏆 Moving winner ${winner.username} to winner room`);
    
    // Find an available winner room
    const winnerRoomId = this.findAvailableRoom(RoomType.WINNER);
    let winnerRoom = this.rooms.get(winnerRoomId);
    
    // Create winner room if it doesn't exist
    if (!winnerRoom) {
      console.log(`Creating new winner room ${winnerRoomId}`);
      winnerRoom = {
        id: winnerRoomId,
        players: new Map(),
        phrase: generatePhrase(),
        status: GameStatus.WAITING,
        maxPlayers: 8,
        type: RoomType.WINNER
      };
      this.rooms.set(winnerRoomId, winnerRoom);
    }

    // Reset winner's game state for new game
    const resetWinner: Player = {
      ...winner,
      position: 0,
      wpm: 0,
      accuracy: 100,
      currentCharIndex: 0,
      finished: false,
      finishTime: undefined,
      rank: undefined
    };

    // Add winner to the winner room
    winnerRoom.players.set(winner.id, resetWinner);
    this.playerRooms.set(winner.id, winnerRoomId);

    // Find the winner's socket and move them to the new room
    const winnerSocket = this.findSocketById(winner.id);
    if (winnerSocket) {
      winnerSocket.join(winnerRoomId);
      winnerSocket.emit(ServerEvents.WINNER_PROMOTED, { 
        message: 'Congratulations! You won and have been promoted to a Winner Room!',
        newRoomId: winnerRoomId 
      });
      winnerSocket.emit(ServerEvents.ROOM_JOINED, { 
        roomId: winnerRoomId, 
        phrase: winnerRoom.phrase,
        isWinnerRoom: true 
      });
      
      console.log(`✅ Winner ${winner.username} moved to winner room ${winnerRoomId}`);
      this.broadcastGameState(winnerRoomId);
    }
  }

  private findSocketById(playerId: string): Socket | null {
    // Get all connected sockets and find the one with matching id
    const sockets = Array.from(this.io.sockets.sockets.values());
    return sockets.find(socket => socket.id === playerId) || null;
  }

  private cleanupRoom(roomId: string) {
    console.log(`🗑️ Cleaning up room ${roomId}`);
    this.rooms.delete(roomId);
    this.redisService.deleteGameRoom(roomId);
    console.log(`✅ Room ${roomId} cleanup complete`);
  }
}