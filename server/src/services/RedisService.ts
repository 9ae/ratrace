import { createClient } from 'redis';

export class RedisService {
  private client: ReturnType<typeof createClient>;

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    this.connect();
  }

  private async connect() {
    try {
      await this.client.connect();
      console.log('✅ Connected to Redis');
    } catch (error) {
      console.error('❌ Redis connection failed:', error);
    }
  }

  async setGameRoom(roomId: string, data: any) {
    await this.client.hSet(`room:${roomId}`, data);
  }

  async getGameRoom(roomId: string) {
    return await this.client.hGetAll(`room:${roomId}`);
  }

  async deleteGameRoom(roomId: string) {
    await this.client.del(`room:${roomId}`);
  }

  async setPlayerSession(playerId: string, roomId: string) {
    await this.client.set(`player:${playerId}`, roomId, { EX: 3600 });
  }

  async getPlayerSession(playerId: string) {
    return await this.client.get(`player:${playerId}`);
  }

  async deletePlayerSession(playerId: string) {
    await this.client.del(`player:${playerId}`);
  }

  async disconnect() {
    await this.client.disconnect();
    console.log('Disconnected from Redis');
  }
}