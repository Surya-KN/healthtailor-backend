# main.py
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
import subprocess
import tempfile
import os
import json
import shutil

app = FastAPI()

@app.post("/analyze")
async def analyze_vcf(file: UploadFile = File(...)):
    # Create a temporary directory
    temp_dir = tempfile.mkdtemp()
    
    try:
        # Save the uploaded VCF file
        vcf_path = os.path.join(temp_dir, "pharmcat.example.vcf")
        with open(vcf_path, "wb") as vcf_file:
            content = await file.read()
            vcf_file.write(content)
        
        # Create an output directory within the temp directory
        output_dir = os.path.join(temp_dir, "test")
        os.makedirs(output_dir)
        
        # Run the Java PharmCAT program
        subprocess.run(
            ['java', '-jar', 'pharmcat.jar', '-vcf', vcf_path, '-reporterJson', '-del', '-o', output_dir],
            check=True
        )
        
        # Construct the path to the expected JSON output file
        json_output_path = os.path.join(output_dir, "pharmcat.example.report.json")
        
        # Check if the output JSON file exists
        if not os.path.exists(json_output_path):
            return JSONResponse(
                status_code=500,
                content={"error": "PharmCAT output file not found"}
            )
        
        # Read and parse the JSON output
        with open(json_output_path, 'r') as json_file:
            pharmcat_output = json.load(json_file)
        
        # Return the JSON response
        return JSONResponse(content=pharmcat_output)
    
    except subprocess.CalledProcessError as e:
        return JSONResponse(
            status_code=500,
            content={"error": "PharmCAT analysis failed", "details": str(e)}
        )
    except json.JSONDecodeError:
        return JSONResponse(
            status_code=500,
            content={"error": "Failed to parse PharmCAT output"}
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": "An unexpected error occurred", "details": str(e)}
        )
    finally:
        # Clean up: remove the temporary directory and all its contents
        shutil.rmtree(temp_dir, ignore_errors=True)

# Run the server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)