import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { ApiResponse } from "./utils/ApiResponse.js";

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

export default app;
