import Redis from "ioredis";
import { config } from "dotenv";
config();

const client = new Redis(process.env.REDIS_URL as string, {
  maxRetriesPerRequest: null,
});
// const client = new Redis({
//   host: "127.0.0.1", // Redis server host
//   port: 6379, // Redis server port
//   maxRetriesPerRequest: null, // Disable retry limitation
// });
client.on("connect", () => {
  console.log("✅ Redis connected successfully");
});

client.on("error", (err) => {
  console.error(" Redis connection error:", err);
});

export { client };
