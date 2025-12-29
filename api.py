from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import subprocess
import shutil
import os
import uuid
import tempfile
from pathlib import Path
import psutil
import json
from typing import Optional

# -------------------------------------------------
# BASE PATHS
# -------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATA_TEST_DIR = os.path.join(BASE_DIR, "data_test")
REF_TEST_DIR  = os.path.join(BASE_DIR, "ref_test")
RESULTS_DIR   = Path(BASE_DIR) / "results_test"

PIPELINE = os.path.join(BASE_DIR, "main.nf")

os.makedirs(DATA_TEST_DIR, exist_ok=True)
os.makedirs(REF_TEST_DIR, exist_ok=True)
os.makedirs(RESULTS_DIR, exist_ok=True)

# -------------------------------------------------
# APP INIT
# -------------------------------------------------
app = FastAPI(title="Variant Calling Pipeline API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------
# JOB REGISTRY (IN-MEMORY, STEP-2 SCOPE)
# -------------------------------------------------
JOBS = {}

# -------------------------------------------------
# HEALTH
# -------------------------------------------------
@app.get("/")
def health():
    return {"status": "running"}

# -------------------------------------------------
# UPLOAD READS
# -------------------------------------------------
@app.post("/upload-reads")
async def upload_reads(
    sample: str = Form(...),
    r1: UploadFile = File(...),
    r2: UploadFile = File(...)
):
    r1_path = os.path.join(DATA_TEST_DIR, f"{sample}_1.fastq.gz")
    r2_path = os.path.join(DATA_TEST_DIR, f"{sample}_2.fastq.gz")

    os.makedirs(DATA_TEST_DIR, exist_ok=True)


    try:
        with tempfile.NamedTemporaryFile(delete=False) as t1:
            shutil.copyfileobj(r1.file, t1)
        with tempfile.NamedTemporaryFile(delete=False) as t2:
            shutil.copyfileobj(r2.file, t2)

        shutil.move(t1.name, r1_path)
        shutil.move(t2.name, r2_path)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    pattern = os.path.join(DATA_TEST_DIR, f"{sample}_{{1,2}}.fastq.gz")
    return {"sample": sample, "files": [r1_path, r2_path], "pattern": pattern}

# -------------------------------------------------
# UPLOAD REFERENCE
# -------------------------------------------------
@app.post("/upload-ref")
async def upload_reference(fasta: UploadFile = File(...)):
    if not fasta.filename.endswith((".fa", ".fna", ".fasta")):
        raise HTTPException(400, "Invalid reference format")

    ref_path = os.path.join(REF_TEST_DIR, fasta.filename)

    os.makedirs(REF_TEST_DIR, exist_ok=True)


    with tempfile.NamedTemporaryFile(delete=False) as tmp:
        shutil.copyfileobj(fasta.file, tmp)

    shutil.move(tmp.name, ref_path)
    return {"reference": ref_path}

# -------------------------------------------------
# CREATE JOB
# -------------------------------------------------
@app.post("/jobs")
def create_job():
    job_id = str(uuid.uuid4())
    JOBS[job_id] = {"iterations": 0, "runs": {}}
    return {"job_id": job_id}

# -------------------------------------------------
# RUN PIPELINE (ITERATION-AWARE)
# -------------------------------------------------
@app.post("/jobs/{job_id}/run")
def run_pipeline(
    job_id: str,
    stage: str = Form(...),
    qual: int = Form(20),
    min_len: int = Form(36),
    reads_pattern: Optional[str] = Form(None),
    ref_path: Optional[str] = Form(None),
):
    if job_id not in JOBS:
        raise HTTPException(404, "Invalid job_id")

    if stage not in ["qc_only", "trim_qc", "full"]:
        raise HTTPException(400, "Invalid stage")

    JOBS[job_id]["iterations"] += 1
    iteration = JOBS[job_id]["iterations"]

    outdir = RESULTS_DIR / f"job_{job_id}" / f"iter_{iteration}_{stage}"
    outdir.mkdir(parents=True, exist_ok=True)

    log_file = outdir / "pipeline.log"

    cmd = [
        "nextflow", "run", PIPELINE,
        "-profile", "test",
        "--stage", stage,
        "--qual", str(qual),
        "--min_len", str(min_len),
        "--outdir", str(outdir)
    ]

    if reads_pattern:
        cmd.extend(["--reads", reads_pattern])
    
    if ref_path:
        cmd.extend(["--ref", ref_path])


    proc = subprocess.Popen(
        cmd,
        cwd=BASE_DIR,
        stdout=open(log_file, "w"),
        stderr=subprocess.STDOUT
    )

    JOBS[job_id]["runs"][iteration] = {
        "pid": proc.pid,
        "log": str(log_file),
        "offset": 0,
        "stage": stage,
        "outdir": outdir
    }

    return {"job_id": job_id, "iteration": iteration, "stage": stage}

# -------------------------------------------------
# STREAM LOGS
# -------------------------------------------------
@app.get("/jobs/{job_id}/logs/{iteration}")
def get_logs(job_id: str, iteration: int):
    run = JOBS.get(job_id, {}).get("runs", {}).get(iteration)
    if not run:
        raise HTTPException(404, "Invalid job or iteration")

    with open(run["log"]) as f:
        f.seek(run["offset"])
        data = f.read()
        run["offset"] = f.tell()

    done = "Succeeded" in data or "Completed at:" in data
    return {"logs": data, "done": done}


# -------------------------------------------------
# QC REPORT SERVING
# -------------------------------------------------
@app.get("/qc/{job_id}/{iteration}/{sample}")
def list_qc_reports(job_id: str, iteration: int, sample: str):
    if job_id not in JOBS:
        raise HTTPException(status_code=404, detail="Invalid job_id")

    runs = JOBS[job_id]["runs"]
    if iteration not in runs:
        raise HTTPException(status_code=404, detail="Invalid iteration")

    outdir = runs[iteration]["outdir"]
    reports = {}

    # -------- fastp --------
    fastp = outdir / "trimmed_reads" / f"{sample}.fastp.html"
    if fastp.exists():
        reports["fastp"] = f"/qc/{job_id}/{iteration}/{fastp.relative_to(outdir)}"

    # -------- falco raw --------
    falco_raw = (
        outdir
        / "falco_raw"
        / f"{sample}_falco_report"
    )
    if falco_raw.exists():
        htmls = sorted(list(falco_raw.glob("*_fastqc_report.html")))
        for html in htmls:
            label = "falco_raw"
            if "_1" in html.name or "_R1" in html.name:
                label += "_R1"
            elif "_2" in html.name or "_R2" in html.name:
                label += "_R2"
            if label in reports:
                label += f"_{html.name}"
            
            reports[label] = f"/qc/{job_id}/{iteration}/{html.relative_to(outdir)}"

    # -------- falco trimmed --------
    falco_trimmed = (
        outdir
        / "falco_trimmed"
        / f"{sample}_falco_trimmed"
    )
    if falco_trimmed.exists():
        htmls = sorted(list(falco_trimmed.glob("*_fastqc_report.html")))
        for html in htmls:
            label = "falco_trimmed"
            if "_1" in html.name or "_R1" in html.name:
                label += "_R1"
            elif "_2" in html.name or "_R2" in html.name:
                label += "_R2"
            
            if label in reports:
                label += f"_{html.name}"

            reports[label] = f"/qc/{job_id}/{iteration}/{html.relative_to(outdir)}"

    # -------- qc summary (new) --------
    qc_summary_dir = outdir / "qc_summary"
    if qc_summary_dir.exists():
        # JSON Reports
        jsons = sorted(list(qc_summary_dir.glob("*_report.json")))
        for j in jsons:
            # e.g. ecoli_R1.trimmed.fastq.gz_Trimmed_report.json
            # Clean up label
            name = j.name.replace("_report.json", "")
            label = f"Summary JSON ({name})"
            reports[label] = f"/qc/{job_id}/{iteration}/{j.relative_to(outdir)}"

    if not reports:
        raise HTTPException(status_code=404, detail="No QC reports found for sample")

    return {
        "job_id": job_id,
        "iteration": iteration,
        "sample": sample,
        "reports": reports
    }


@app.get("/qc/{job_id}/{iteration}/{path:path}")
def serve_qc_file(job_id: str, iteration: int, path: str):

    if job_id not in JOBS:
        raise HTTPException(404, "Invalid job_id")

    runs = JOBS[job_id]["runs"]
    if iteration not in runs:
        raise HTTPException(404, "Invalid iteration")

    outdir: Path = runs[iteration]["outdir"]

    requested = Path(path)
    if ".." in requested.parts:
        raise HTTPException(403, "Invalid path")

    file_path = outdir / requested

    if not file_path.exists():
        raise HTTPException(404, "Report not found")

    media_type = "text/html"
    if file_path.suffix == ".json":
        media_type = "application/json"
    elif file_path.suffix == ".txt":
        media_type = "text/plain"

    return FileResponse(file_path, media_type=media_type)
