import Redis from "ioredis";
import { config } from "dotenv";
config();

const client = new Redis(process.env.REDIS_URL as string, {
  maxRetriesPerRequest: null,
});
client.on("connect", () => {
  console.log("✅ Redis connected successfully");
});

client.on("error", (err) => {
  console.error(" Redis connection error:", err);
});

export { client };
