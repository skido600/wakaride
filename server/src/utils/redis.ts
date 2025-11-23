import Redis from "ioredis";

const client = new Redis({
  host: "127.0.0.1",
  port: 6379,
  maxRetriesPerRequest: null,
});

client.on("connect", () => {
  console.log("✅ Redis connected successfully");
});

client.on("error", (err) => {
  console.error(" Redis connection error:", err);
});

export { client };
