import { Redis } from "@upstash/redis"

class CacheService {
  private redis: Redis

  constructor() {
    this.redis = new Redis({
      url: process.env.KV_REST_API_URL!,
      token: process.env.KV_REST_API_TOKEN!,
    })
  }

  async get(key: string): Promise<any> {
    try {
      return await this.redis.get(key)
    } catch (error) {
      console.error("Cache get error:", error)
      return null
    }
  }

  async set(key: string, value: any): Promise<void> {
    try {
      await this.redis.set(key, value)
    } catch (error) {
      console.error("Cache set error:", error)
    }
  }

  async setex(key: string, seconds: number, value: any): Promise<void> {
    try {
      await this.redis.setex(key, seconds, value)
    } catch (error) {
      console.error("Cache setex error:", error)
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key)
    } catch (error) {
      console.error("Cache del error:", error)
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key)
      return result === 1
    } catch (error) {
      console.error("Cache exists error:", error)
      return false
    }
  }

  async expire(key: string, seconds: number): Promise<void> {
    try {
      await this.redis.expire(key, seconds)
    } catch (error) {
      console.error("Cache expire error:", error)
    }
  }
}

export const cache = new CacheService()
