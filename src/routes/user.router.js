import { Router } from "express";
import { registerUser } from "../handlers/user.handler.js";

const userRouter = Router();

userRouter.get("/", (req, res) => {
  res.send("User router");
});

userRouter.post("/register", registerUser);
export { userRouter };
