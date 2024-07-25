import { Router } from "express";
import {
  registerUser,
  completeProfile,
  addMedications,
  getMedications,
} from "../handlers/user.handler.js";
import { login } from "../handlers/user.handler.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";

import express from "express";
import multer from "multer";

const userRouter = Router();

userRouter.get("/", (req, res) => {
  res.send("User router");
});

userRouter.post("/login", login);

const upload = multer({ dest: "uploads/" });

// userRouter.post("/register", upload.single("vcf"), registerUser);
userRouter.post("/register", registerUser);
userRouter.post(
  "/completeProfile",
  authenticateToken,
  upload.single("vcf"),
  completeProfile
);

userRouter.post("/medications", authenticateToken, addMedications);
userRouter.get("/medications", authenticateToken, getMedications);

export { userRouter };
