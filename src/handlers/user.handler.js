import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { hashPassword } from "../utils/hashPassword.js";
import { db } from "../db/postgresdb.js";

const registerUser = asyncHandler(async (req, res) => {
  const { first_name, last_name, email, password, birthdate, gender } =
    req.body;

  // Validate input
  if (
    !first_name ||
    !last_name ||
    !email ||
    !password ||
    !birthdate ||
    !gender
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // Check if user already exists
  const existingUser = await db.oneOrNone(
    "SELECT * FROM users WHERE email = $1",
    [email]
  );
  if (existingUser) {
    throw new ApiError(409, "User with this email already exists");
  }

  // Hash password
  const password_hash = await hashPassword(password);

  // Calculate age
  const today = new Date();
  const birthdateObj = new Date(birthdate);
  const age = today.getFullYear() - birthdateObj.getFullYear();

  // Insert new user
  const newUser = await db.one(
    `
    INSERT INTO users (first_name, last_name, email, password_hash, birthdate, age, gender)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id, first_name, last_name, email, birthdate, age, gender
  `,
    [first_name, last_name, email, password_hash, birthdate, age, gender]
  );

  // Send response
  res
    .status(201)
    .json(new ApiResponse(201, newUser, "User registered successfully"));
});

export { registerUser };
