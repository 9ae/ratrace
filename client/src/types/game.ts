export enum GameStatus {
  WAITING = 'waiting',
  ACTIVE = 'active',
  FINISHED = 'finished'
}

// Client to Server Events
export enum ClientEvents {
  JOIN_ROOM = 'join-room',
  REJOIN_ROOM = 'rejoin-room',
  START_GAME = 'start-game',
  GET_GAME_STATE = 'get-game-state',
  START_TYPING = 'start-typing',
  DISCONNECT = 'disconnect',
  ERROR = 'error'
}

// Server to Client Events
export enum ServerEvents {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  CONNECT_ERROR = 'connect_error',
  ROOM_JOINED = 'room-joined',
  ROOM_FULL = 'room-full',
  REJOIN_SUCCESS = 'rejoin-success',
  REJOIN_FAILED = 'rejoin-failed',
  GAME_STATE = 'game-state',
  GAME_STARTED = 'game-started',
  RACE_FINISHED = 'race-finished',
  GAME_ENDED = 'game-ended',
  WINNER_PROMOTED = 'winner-promoted',
  ERROR = 'error'
}

export enum RoomType {
  REGULAR = 'regular',
  WINNER = 'winner'
}

export interface Player {
  id: string;
  username: string;
  position: number;
  wpm: number;
  accuracy: number;
  currentCharIndex: number;
  finished: boolean;
  finishTime?: number;
  rank?: number;
}

export interface GameState {
  roomId: string;
  players: Player[];
  phrase: string;
  status: GameStatus;
  timeRemaining?: number;
  roomType?: RoomType;
}

export interface TypingProgress {
  playerId: string;
  currentText: string;
  position: number;
  wpm: number;
  accuracy: number;
}