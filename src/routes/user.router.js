const express = require('express');
const router = express.Router();
const userHandler = require('../handlers/user.handler');
const asyncHandler = require('../utils/asyncHandler');

// User registration
router.post('/register', asyncHandler(userHandler.registerUser));

// User login
router.post('/login', asyncHandler(userHandler.loginUser));

// Get user profile
router.get('/profile', asyncHandler(userHandler.getUserProfile));

// Update user profile
router.put('/profile', asyncHandler(userHandler.updateUserProfile));

// Get user's medical history
router.get('/medical-history', asyncHandler(userHandler.getMedicalHistory));

// Add medical history entry
router.post('/medical-history', asyncHandler(userHandler.addMedicalHistoryEntry));

// Get user's medications
router.get('/medications', asyncHandler(userHandler.getMedications));

// Add medication
router.post('/medications', asyncHandler(userHandler.addMedication));

// Get user's allergies
router.get('/allergies', asyncHandler(userHandler.getAllergies));

// Add allergy
router.post('/allergies', asyncHandler(userHandler.addAllergy));

// Get pharmacogenomic profile
router.get('/pharmacogenomic-profile', asyncHandler(userHandler.getPharmacogenomicProfile));

// Upload genetic data
router.post('/upload-genetic-data', asyncHandler(userHandler.uploadGeneticData));

// Upload profile photo
router.post('/profile-photo', asyncHandler(userHandler.uploadProfilePhoto));

// Get profile photo
router.get('/profile-photo', asyncHandler(userHandler.getProfilePhoto));

// Upload genetic data (VCF file)
router.post('/genetic-data', asyncHandler(userHandler.uploadGeneticData));

module.exports = router;