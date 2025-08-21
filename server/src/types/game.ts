export interface Player {
  id: string;
  username: string;
  position: number;
  wpm: number;
  accuracy: number;
  currentCharIndex: number;
  finished: boolean;
  finishTime?: number;
}

export interface GameRoom {
  id: string;
  players: Map<string, Player>;
  phrase: string;
  status: 'waiting' | 'active' | 'finished';
  startTime?: number;
  maxPlayers: number;
}

export interface GameState {
  roomId: string;
  players: Player[];
  phrase: string;
  status: 'waiting' | 'active' | 'finished';
  timeRemaining?: number;
}

export interface TypingProgress {
  playerId: string;
  currentText: string;
  position: number;
  wpm: number;
  accuracy: number;
}