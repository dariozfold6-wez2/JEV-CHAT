import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Límite por IP: 20 preguntas por hora.
// Si no configurás Upstash, el chat funciona igual pero sin límite.
// Acepta los nombres de Upstash y los que crea la integración de Vercel (KV_*).
const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

const limiter =
  url && token
    ? new Ratelimit({
        redis: new Redis({ url, token }),
        limiter: Ratelimit.slidingWindow(20, "1 h"),
        prefix: "preguntale-a-jev",
      })
    : null;

export async function permitir(ip: string): Promise<boolean> {
  if (!limiter) return true;
  const { success } = await limiter.limit(ip);
  return success;
}
