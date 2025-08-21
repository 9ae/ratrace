export enum GameStatus {
  WAITING = 'waiting',
  ACTIVE = 'active',
  FINISHED = 'finished'
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
}

export interface TypingProgress {
  playerId: string;
  currentText: string;
  position: number;
  wpm: number;
  accuracy: number;
}