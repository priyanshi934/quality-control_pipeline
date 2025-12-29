# Variant Calling Pipeline

A comprehensive bioinformatics pipeline for variant calling, featuring a Nextflow-based workflow, a FastAPI backend, and a modern React frontend.

## Features

*   **Nextflow Pipeline:** Automated workflow for Quality Control, Trimming, Alignment, and Variant Calling.
*   **Interactive Dashboard:** React-based UI to upload files, monitor jobs, and view results.
*   **Real-time Monitoring:** Track pipeline progress and view logs directly from the browser.
*   **QC Reports:** Integrated MultiQC/FastQC-style reporting (Falco/Fastp).

## Prerequisites

Ensure you have the following installed:

*   [Conda](https://docs.conda.io/en/latest/) (or Mamba)
*   [Nextflow](https://www.nextflow.io/) (Requires Java 11+)
*   [Node.js](https://nodejs.org/) (v16+ recommended)

## Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/YOUR_USERNAME/bioinfo-pipeline.git
    cd bioinfo-pipeline
    ```

2.  **Set up the Conda Environment:**
    This environment includes all necessary bioinformatics tools (bcftools, fastp, falco, etc.) and Python dependencies.
    ```bash
    conda env create -f environment.yml
    ```
3. **Set up the FastApi backend Environment:**
    ```bash
    python -m venv .venv
    source .venv/bin/activate
    pip install -r requirements.txt
    deactivate
    ```

3.  **Install Frontend Dependencies:**
    ```bash
    cd frontend
    npm install
    cd ..
    ```

## Running the Application

You need to run both the backend and frontend servers.

### 1. Start the Backend (API)
From the root directory of the project:
```bash
# Make sure your both environment is activated
conda activate variant-calling
source .venv/bin/activate

# Run the FastAPI server
uvicorn api:app --reload
```
The API will be available at `http://localhost:8000`.

### 2. Start the Frontend
Open a new terminal window, navigate to the frontend directory, and start the development server:
```bash
cd frontend
npm run dev
```
The application will be accessible at `http://localhost:5173`.

## Usage

1.  Open your browser and go to `http://localhost:5173`.
2.  **Upload Data:** Upload your paired-end FASTQ files (`_R1`, `_R2`).
3.  **Select Reference:** Upload a reference genome (`.fna` / `.fasta`) if running the full pipeline.
4.  **Configure:** Choose the pipeline stage:
    *   `QC Only`: Generates quality reports.
    *   `Trim & QC`: Trims reads and generates reports.
    *   `Full Pipeline`: Performs alignment and variant calling.
5.  **Run:** Start the job and monitor the progress in the "Jobs" tab.

## Project Structure

*   `api.py`: FastAPI backend server.
*   `main.nf`: Nextflow pipeline definition.
*   `frontend/`: React frontend application.
*   `environment.yml`: Conda environment specification.
*   `data_test/` & `ref_test/`: Directories for storing uploaded test data which are created on runtime.
*   `results_test/`: Output directory for pipeline results.






