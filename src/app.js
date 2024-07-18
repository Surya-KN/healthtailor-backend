import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { ApiResponse } from "./utils/ApiResponse.js";
import errorHandler from "./middlewares/errorHandler.js";

const app = express();
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

app.on("error", (error) => {
  console.error("Error starting the server", error);
  process.exit(1);
});

app.get("/", (req, res) => {
  res.send(new ApiResponse(200, "Welcome to the API"));
});

import { userRouter } from "./routes/user.router.js";
import pharmCatRouter from "./utils/generateReport.js";

app.use("/api/users", userRouter);
app.use("/api/pharmcats", pharmCatRouter);
app.use(errorHandler);

export default app;
