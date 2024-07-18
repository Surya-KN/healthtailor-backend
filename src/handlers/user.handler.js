import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { hashPassword } from "../utils/hashPassword.js";
import { db } from "../db/postgresdb.js";
import { generateReport } from "../utils/generateReport.js";
import { mongoose } from "../db/mongodb.js";
import fs from "fs";

const registerUser = asyncHandler(async (req, res) => {
  const { first_name, last_name, email, password, birthdate, gender } =
    JSON.parse(req.body.data);

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
    // Clean up uploaded file if it exists
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting file:", err);
      });
    }
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

  // Handle file upload and report generation asynchronously
  if (req.file) {
    generateReportAsync(req.file.path, newUser.id);
  }

  // Send response
  res
    .status(201)
    .json(new ApiResponse(201, newUser, "User registered successfully"));
});

const generateReportAsync = async (filePath, userId) => {
  try {
    const reportData = await generateReport(filePath);

    // Use the existing mongoose connection
    const Report = mongoose.model(
      "Report",
      new mongoose.Schema({
        userId: String,
        reportData: Object,
        createdAt: Date,
      })
    );

    // Save report to MongoDB
    const report = await new Report({
      userId: userId,
      reportData: reportData,
      createdAt: new Date(),
    }).save();

    console.log(`Report generated and saved for user ${userId}`);
    console.log(`Report Object ID: ${report._id}`);

    // Delete the temporary file
    fs.unlinkSync(filePath);
  } catch (error) {
    console.error(`Error generating report for user ${userId}:`, error);
    // Handle error (e.g., log to error tracking service)
  }
};

export { registerUser };
