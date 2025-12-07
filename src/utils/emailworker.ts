import { Queue, Worker } from "bullmq";
import { client as redisClient } from "./redis";
import STMPservice from "./SendingMail";

export const queue = new Queue("send-email", {
  connection: redisClient,
});

export const initalizeEmailWorker = () => {
  const worker = new Worker(
    "send-email",
    async (job: {
      data: { type: string; result?: any; user: any; verificationLink: string };
    }) => {
      const { type, user, result, verificationLink } = job.data;

      if (type === "verification") {
        await STMPservice.Sendingverification(user, verificationLink);
        console.log("verification Mail successfully sent");
      } else if (type === "otp") {
        await STMPservice.SendingOtp(user, verificationLink);
        console.log("verification otp successfully sent");
      } else if (type === "Retryverification") {
        await STMPservice.Sendingverification(user, verificationLink);
        console.log("retry verification Mail successfully sent");
      } else if (type === "result") {
        if (!result) {
          console.error("Missing result data for resulit email job", job.data);
          return;
        }
        await STMPservice.SendverificationResult(user, result);
        console.log("driver verification result email sent");
      } else {
        console.warn("Unknown email type, skipping job:", job.data);
        return;
      }
    },
    {
      connection: redisClient,
    }
  );

  worker.on("failed", (job, err) => {
    console.error(`Image upload job failed for job ${job}:`, err);
  });

  return worker;
};
