import express from "express";
import { config } from "dotenv";
import authroute from "./routes/authRoute.ts";
import { HandleError, notFound } from "./middleware/ErroHandling.ts";
import { connectDb } from "./utils/connectDB.ts";
import { initalizeEmailWorker } from "./utils/emailworker.ts";
import ProfileRoute from "./routes/profileRoute.ts";
import cookieParser from "cookie-parser";

import path from "path";
import driverRoute from "./routes/driverRoute.ts";
config();

//port
const port = process.env.PORT;

const app = express();
//middlewares
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/images", express.static(path.join(process.cwd(), "/public/images")));
//routes
app.use("/api/auth", authroute);
app.use("/api/edit", ProfileRoute);
app.use("/api/driver", driverRoute);

//error handling
app.use(HandleError);
app.use(notFound);
//listen to server
app.listen(port, async () => {
  await connectDb();
  console.log(`Server running on port ${port}`);
  initalizeEmailWorker();
});
