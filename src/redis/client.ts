import Redis from "ioredis";

// Safely check that REDIS_URL is defined
if (!process.env.REDIS_URL) {
  throw new Error("Missing REDIS_URL environment variable");
}

const redis = new Redis(process.env.REDIS_URL);

console.log("Connecting to Redis at:", process.env.REDIS_URL);
export default redis;