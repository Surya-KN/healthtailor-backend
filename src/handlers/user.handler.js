import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { hashPassword } from "../utils/hashPassword.js";
import { db } from "../db/postgresdb.js";
import { generateReport } from "../utils/generateReport.js";
import { mongoose } from "../db/mongodb.js";

import fs from "fs";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { Report } from "../db/mongodb.js";

// const registerUser = asyncHandler(async (req, res) => {
//   const { first_name, last_name, email, password, birthdate, gender } =
//     JSON.parse(req.body.data);

//   // Validate input
//   if (
//     !first_name ||
//     !last_name ||
//     !email ||
//     !password ||
//     !birthdate ||
//     !gender
//   ) {
//     throw new ApiError(400, "All fields are required");
//   }

//   // Check if user already exists
//   const existingUser = await db.oneOrNone(
//     "SELECT * FROM users WHERE email = $1",
//     [email]
//   );
//   if (existingUser) {
//     // Clean up uploaded file if it exists
//     if (req.file) {
//       fs.unlink(req.file.path, (err) => {
//         if (err) console.error("Error deleting file:", err);
//       });
//     }
//     throw new ApiError(409, "User with this email already exists");
//   }

//   // Hash password
//   const password_hash = await hashPassword(password);

//   // Calculate age
//   const today = new Date();
//   const birthdateObj = new Date(birthdate);
//   const age = today.getFullYear() - birthdateObj.getFullYear();

//   // Insert new user
//   const newUser = await db.one(
//     `
//     INSERT INTO users (first_name, last_name, email, password_hash, birthdate, age, gender)
//     VALUES ($1, $2, $3, $4, $5, $6, $7)
//     RETURNING id, first_name, last_name, email, birthdate, age, gender
//   `,
//     [first_name, last_name, email, password_hash, birthdate, age, gender]
//   );

//   // Handle file upload and report generation asynchronously
//   if (req.file) {
//     generateReportAsync(req.file.path, newUser.id);
//   }

//   // Send response
//   res
//     .status(201)
//     .json(new ApiResponse(201, newUser, "User registered successfully"));
// });
const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  // Validate input
  if (!username || !email || !password) {
    throw new ApiError(400, "Username, email, and password are required");
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

  // Insert new user
  let newUser;
  //   = await db.one(
  //   "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email",
  //   [username, email, password_hash]
  // );
  try {
    newUser = await db.one(
      "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email",
      [username, email, password_hash]
    );
  } catch (error) {
    // Handle errors, e.g., user already exists, database connection issues, etc.
    console.error("Error registering user:", error);
    throw error;
  }

  // Send response
  res
    .status(201)
    .json(new ApiResponse(201, newUser, "User registered successfully"));
});

const completeProfile = asyncHandler(async (req, res) => {
  const { first_name, last_name, birthdate, gender } = JSON.parse(
    req.body.data
  );

  // Validate input
  if (!first_name || !last_name || !birthdate || !gender) {
    throw new ApiError(400, "All fields are required");
  }

  // Update user information
  const updatedUser = await db.one(
    "UPDATE users SET first_name = $1, last_name = $2, birthdate = $3, gender = $4 WHERE id = $5 RETURNING *",
    [first_name, last_name, birthdate, gender, req.user.id]
  );

  // Handle file upload and report generation asynchronously
  if (req.file) {
    generateReportAsync(req.file.path, req.user.id);
  }

  // Send response
  res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Profile completed successfully"));
});

const generateReportAsync = async (filePath, userId) => {
  console.log(`Generating report for user ${userId}...`);
  try {
    const reportData = await generateReport(filePath);

    // Use the existing mongoose connection
    // const Report = mongoose.model(
    //   "Report",
    //   new mongoose.Schema({
    //     userId: String,
    //     reportData: Object,
    //     createdAt: Date,
    //   })
    // );

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

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  // Check if user exists
  let user;
  try {
    user = await db.one("SELECT * FROM users WHERE email = $1", [email]);
  } catch (err) {
    throw new ApiError(404, "User not found");
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new ApiError(401, "Invalid credentials");
  }

  // Generate JWT token
  const payload = {
    user: {
      id: user.id,
    },
  };

  jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: "10h" },
    (err, token) => {
      if (err) throw err;
      res.json({ token });
    }
  );
});

const addMedications = asyncHandler(async (req, res) => {
  const { name, dosage, schedule, stock, drugs } = req.body;

  // Validate input
  // if (!name || !dosage || !frequency || !start_date || !end_date) {
  //   throw new ApiError(400, "All fields are required");
  // }

  const warning = await getWarnings(drugs, req.user.id);
  // Insert new medication
  const newMedication = await db.one(
    `
    INSERT INTO medications (user_id, name, dosage, schedule, stock, warning, drugs)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id, name, dosage, schedule, stock, warning, drugs
  `,
    [req.user.id, name, dosage, schedule, stock, warning, drugs]
  );

  // Send response
  res
    .status(201)
    .json(new ApiResponse(201, newMedication, "Medication added successfully"));
});
const getMedications = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  try {
    const medications = await db.any(
      "SELECT * FROM medications WHERE user_id = $1",
      [userId]
    );

    if (medications.length === 0) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "No medications found for the user"));
    }

    res
      .status(200)
      .json(
        new ApiResponse(200, medications, "Medications retrieved successfully")
      );
  } catch (error) {
    throw new ApiError(500, "An error occurred while fetching medications");
  }
});

const getWarnings = async (drugs, userId) => {
  let warning = "";
  const report = await fetchReport(userId);

  if (!report) {
    console.log("No report found for the given userId.");
    return null;
  }
  // console.log(report.reportData.drugs["CPIC Guideline Annotation"]);
  const institutes = report.reportData.drugs;

  for (const drug of drugs) {
    for (const institute in institutes) {
      const founddrug = report.reportData.drugs[institute][drug];
      if (founddrug) {
        if (
          founddrug &&
          founddrug.guidelines &&
          founddrug.guidelines.length > 0 &&
          founddrug.guidelines[0].annotations &&
          founddrug.guidelines[0].annotations.length > 0 &&
          founddrug.guidelines[0].annotations[0].drugRecommendation
        ) {
          console.log(
            founddrug.guidelines[0].annotations[0].drugRecommendation
          );
          const filteredWarning = warning.replace(/<[^>]+>/g, "");
          warning += founddrug.guidelines[0].annotations[0].drugRecommendation;
        }
      }
    }
  }
  // const reportData = JSON.parse(report.reportData);
  // console.log(typeof reportData);
  // let rejs = JSON.parse(report);
  // console.log("Report found:", rejs.reportData.drugs[0]);
  // for (const drug of drugs) {
  //   if (report.reportData.drugs[0]) {
  //     warning += report.reportData[drug].warning;

  // Check for drug interactions
  // if (drugs.includes("aspirin") && drugs.includes("ibuprofen")) {
  //   warning = "Avoid taking aspirin and ibuprofen together";
  // }

  return warning.replace(/<[^>]+>/g, "");
};

const fetchReport = async (userId) => {
  try {
    // Assuming the Report model is already defined as shown in the generateReportAsync function
    // const Report = mongoose.model(
    //   "Report",
    //   new mongoose.Schema({
    //     userId: String,
    //     reportData: Object,
    //     createdAt: Date,
    //   })
    // );

    // Find the report by userId
    const report = await Report.findOne({ userId: userId });

    if (!report) {
      console.log("No report found for the given userId.");
      return null;
    }

    // console.log("Report found:", report);
    return report;
  } catch (error) {
    console.error("Error fetching report from MongoDB:", error);
    throw error;
  }
};

export { registerUser, login, completeProfile, addMedications, getMedications };
