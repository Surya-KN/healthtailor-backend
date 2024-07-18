import express from "express";
import axios from "axios";
import FormData from "form-data";
import multer from "multer";
import fs from "fs";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/analyze-vcf", upload.single("vcf"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No VCF file uploaded" });
  }

  const form = new FormData();
  form.append("file", fs.createReadStream(req.file.path), {
    filename: "pharmcat.example.vcf",
    contentType: "text/plain",
  });

  try {
    const response = await axios.post("http://localhost:8000/analyze", form, {
      headers: {
        ...form.getHeaders(),
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    // Delete the temporary file
    fs.unlinkSync(req.file.path);

    res.json(response.data);
  } catch (error) {
    console.error("Error calling PharmCAT service:", error);

    // Delete the temporary file
    fs.unlinkSync(req.file.path);

    res.status(500).json({
      error: "Failed to analyze VCF file",
      details: error.response ? error.response.data : error.message,
    });
  }
});

export default router;
