import { Router } from "express";
import { registerUser } from "../handlers/user.handler.js";
import express from "express";
import multer from "multer";

const userRouter = Router();

userRouter.get("/", (req, res) => {
  res.send("User router");
});

const upload = multer({ dest: "uploads/" });

userRouter.post("/register", upload.single("vcf"), registerUser);

export { userRouter };
