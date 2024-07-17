const { ApiError } = require('../utils/ApiError');
const { ApiResponse } = require('../utils/ApiResponse');
const { User } = require('../db/postgresql'); // Assuming you have a User model
const { PharmacogenomicProfile } = require('../db/mongodb'); // Assuming you have a PharmacogenomicProfile model
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      let uploadPath = 'uploads/';
      if (file.fieldname === 'vcf') {
        uploadPath += 'vcf/';
      } else if (file.fieldname === 'photo') {
        uploadPath += 'photos/';
      }
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });
  
  const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
      if (file.fieldname === 'vcf') {
        if (path.extname(file.originalname) !== '.vcf') {
          return cb(new Error('Only VCF files are allowed'));
        }
      } else if (file.fieldname === 'photo') {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
          return cb(new Error('Only image files are allowed'));
        }
      }
      cb(null, true);
    },
    limits: {
      fileSize: 10 * 1024 * 1024 // 10 MB limit
    }
  });

const userHandler = {
    uploadProfilePhoto: async (req, res) => {
        upload.single('photo')(req, res, async (err) => {
          if (err) {
            throw new ApiError(400, err.message);
          }
          
          if (!req.file) {
            throw new ApiError(400, 'No file uploaded');
          }
    
          const user = await User.findByPk(req.user.id);
          if (!user) {
            throw new ApiError(404, 'User not found');
          }
    
          // Update user's photo path in the database
          user.photoPath = req.file.path;
          await user.save();
    
          return res.json(new ApiResponse(200, { photoPath: user.photoPath }, 'Profile photo uploaded successfully'));
        });
      },
    
      uploadGeneticData: async (req, res) => {
        upload.single('vcf')(req, res, async (err) => {
          if (err) {
            throw new ApiError(400, err.message);
          }
          
          if (!req.file) {
            throw new ApiError(400, 'No file uploaded');
          }
    
          // Process the VCF file
          // This is where you'd integrate with PharmCAT for analysis
          // For this example, we'll just create a dummy profile
    
          try {
            // Read the VCF file
            const vcfContent = await fs.readFile(req.file.path, 'utf8');
    
            // Here, you would process the VCF content with PharmCAT
            // For now, we'll just create a dummy profile
    
            const dummyProfile = await PharmacogenomicProfile.create({
              user_id: req.user.id,
              pharmcat_report: { /* dummy data */ },
              drug_gene_interactions: [/* dummy data */],
              vcf_file_path: req.file.path
            });
    
            return res.json(new ApiResponse(201, { profile: dummyProfile }, 'Genetic data processed successfully'));
          } catch (error) {
            // If there's an error, remove the uploaded file
            await fs.unlink(req.file.path);
            throw new ApiError(500, 'Error processing genetic data');
          }
        });
      },
    
      getProfilePhoto: async (req, res) => {
        const user = await User.findByPk(req.user.id);
        if (!user || !user.photoPath) {
          throw new ApiError(404, 'Profile photo not found');
        }
    
        res.sendFile(path.resolve(user.photoPath));
      },

  registerUser: async (req, res) => {
    const { email, password, firstName, lastName, dateOfBirth, gender } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new ApiError(400, 'User already exists');
    }

    // Create new user
    const newUser = await User.create({
      email,
      password, // Remember to hash the password before storing
      firstName,
      lastName,
      dateOfBirth,
      gender
    });

    return res.json(new ApiResponse(201, { user: newUser }, 'User registered successfully'));
  },

  loginUser: async (req, res) => {
    const { email, password } = req.body;
    
    // Find user and verify password
    const user = await User.findOne({ where: { email } });
    if (!user || !(await user.verifyPassword(password))) {
      throw new ApiError(401, 'Invalid credentials');
    }

    // Generate JWT token
    const token = user.generateAuthToken();

    return res.json(new ApiResponse(200, { token }, 'Login successful'));
  },

  getUserProfile: async (req, res) => {
    // Assuming user is authenticated and req.user is set
    const user = await User.findByPk(req.user.id);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    return res.json(new ApiResponse(200, { user }, 'User profile retrieved successfully'));
  },

  updateUserProfile: async (req, res) => {
    const { firstName, lastName, gender, height, weight } = req.body;
    
    const user = await User.findByPk(req.user.id);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.gender = gender || user.gender;
    user.height = height || user.height;
    user.weight = weight || user.weight;

    await user.save();

    return res.json(new ApiResponse(200, { user }, 'User profile updated successfully'));
  },

  getMedicalHistory: async (req, res) => {
    const medicalHistory = await User.findByPk(req.user.id, {
      include: 'medicalHistory'
    });

    return res.json(new ApiResponse(200, { medicalHistory }, 'Medical history retrieved successfully'));
  },

  addMedicalHistoryEntry: async (req, res) => {
    const { condition, diagnosedDate, status, notes } = req.body;
    
    const user = await User.findByPk(req.user.id);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const newEntry = await user.createMedicalHistory({
      condition,
      diagnosedDate,
      status,
      notes
    });

    return res.json(new ApiResponse(201, { entry: newEntry }, 'Medical history entry added successfully'));
  },

  getMedications: async (req, res) => {
    const medications = await User.findByPk(req.user.id, {
      include: 'medications'
    });

    return res.json(new ApiResponse(200, { medications }, 'Medications retrieved successfully'));
  },

  addMedication: async (req, res) => {
    const { medicationName, dosage, frequency, startDate, endDate } = req.body;
    
    const user = await User.findByPk(req.user.id);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const newMedication = await user.createMedication({
      medicationName,
      dosage,
      frequency,
      startDate,
      endDate
    });

    return res.json(new ApiResponse(201, { medication: newMedication }, 'Medication added successfully'));
  },

  getAllergies: async (req, res) => {
    const allergies = await User.findByPk(req.user.id, {
      include: 'allergies'
    });

    return res.json(new ApiResponse(200, { allergies }, 'Allergies retrieved successfully'));
  },

  addAllergy: async (req, res) => {
    const { allergen, severity } = req.body;
    
    const user = await User.findByPk(req.user.id);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const newAllergy = await user.createAllergy({
      allergen,
      severity
    });

    return res.json(new ApiResponse(201, { allergy: newAllergy }, 'Allergy added successfully'));
  },

  getPharmacogenomicProfile: async (req, res) => {
    const profile = await PharmacogenomicProfile.findOne({ user_id: req.user.id });
    if (!profile) {
      throw new ApiError(404, 'Pharmacogenomic profile not found');
    }

    return res.json(new ApiResponse(200, { profile }, 'Pharmacogenomic profile retrieved successfully'));
  },

  uploadGeneticData: async (req, res) => {
    // This would involve processing the uploaded genetic data file
    // and integrating with PharmCAT for analysis
    // For brevity, we'll just create a dummy profile here

    const dummyProfile = await PharmacogenomicProfile.create({
      user_id: req.user.id,
      pharmcat_report: { /* dummy data */ },
      drug_gene_interactions: [/* dummy data */]
    });

    return res.json(new ApiResponse(201, { profile: dummyProfile }, 'Genetic data processed successfully'));
  }
};

module.exports = userHandler;