import axios from "axios";
import FormData from "form-data";
import fs from "fs";

const generateReport = async (filePath) => {
  const form = new FormData();
  form.append("file", fs.createReadStream(filePath), {
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

    return response.data;
  } catch (error) {
    console.error("Error calling PharmCAT service:", error);
    throw new Error(
      "Failed to analyze VCF file: " +
        (error.response ? error.response.data : error.message)
    );
  }
};

export { generateReport };
