import axios from "axios";

/*
  Use environment variable in production.
  Falls back to Render backend if not defined.
*/
const API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://biocanvas-backend.onrender.com";

export const api = axios.create({
  baseURL: API_URL,
});

/* -----------------------------
   HEALTH CHECK
------------------------------ */
export const checkHealth = async () => {
  const response = await api.get("/");
  return response.data;
};

/* -----------------------------
   UPLOAD READS
------------------------------ */
export const uploadReads = async (
  sample: string,
  r1: File,
  r2: File
) => {
  const formData = new FormData();
  formData.append("sample", sample);
  formData.append("r1", r1);
  formData.append("r2", r2);

  const response = await api.post("/upload-reads", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

/* -----------------------------
   UPLOAD REFERENCE
------------------------------ */
export const uploadReference = async (file: File) => {
  const formData = new FormData();
  formData.append("fasta", file);

  const response = await api.post("/upload-ref", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

/* -----------------------------
   CREATE JOB
------------------------------ */
export const createJob = async () => {
  const response = await api.post("/jobs");
  return response.data;
};

/* -----------------------------
   RUN PIPELINE
------------------------------ */
export const runPipeline = async (
  jobId: string,
  params: {
    stage: string;
    qual: number;
    min_len: number;
    reads_pattern?: string;
    ref_path?: string;
  }
) => {
  const formData = new FormData();
  formData.append("stage", params.stage);
  formData.append("qual", params.qual.toString());
  formData.append("min_len", params.min_len.toString());

  if (params.reads_pattern) {
    formData.append("reads_pattern", params.reads_pattern);
  }

  if (params.ref_path) {
    formData.append("ref_path", params.ref_path);
  }

  const response = await api.post(
    `/jobs/${jobId}/run`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

/* -----------------------------
   GET LOGS
------------------------------ */
export const getLogs = async (
  jobId: string,
  iteration: number
) => {
  const response = await api.get(
    `/jobs/${jobId}/logs/${iteration}`
  );
  return response.data;
};

/* -----------------------------
   GET QC REPORTS
------------------------------ */
export const getQCReports = async (
  jobId: string,
  iteration: number,
  sample: string
) => {
  const response = await api.get(
    `/qc/${jobId}/${iteration}/${sample}`
  );
  return response.data;
};