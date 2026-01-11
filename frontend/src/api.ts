import axios from 'axios';

const API_URL = 'https://quality-control-pipeline.onrender.com';

export const api = axios.create({
  baseURL: API_URL,
});

export const checkHealth = async () => {
  const response = await api.get('/');
  return response.data;
};

export const uploadReads = async (sample: string, r1: File, r2: File) => {
  const formData = new FormData();
  formData.append('sample', sample);
  formData.append('r1', r1);
  formData.append('r2', r2);
  const response = await api.post('/upload-reads', formData);
  return response.data;
};

export const uploadReference = async (file: File) => {
  const formData = new FormData();
  formData.append('fasta', file);
  const response = await api.post('/upload-ref', formData);
  return response.data;
};

export const createJob = async () => {
  const response = await api.post('/jobs');
  return response.data;
};

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
  formData.append('stage', params.stage);
  formData.append('qual', params.qual.toString());
  formData.append('min_len', params.min_len.toString());
  if (params.reads_pattern) {
    formData.append('reads_pattern', params.reads_pattern);
  }
  if (params.ref_path) {
    formData.append('ref_path', params.ref_path);
  }
  const response = await api.post(`/jobs/${jobId}/run`, formData);
  return response.data;
};

export const getLogs = async (jobId: string, iteration: number) => {
  const response = await api.get(`/jobs/${jobId}/logs/${iteration}`);
  return response.data;
};

export const getQCReports = async (jobId: string, iteration: number, sample: string) => {
  const response = await api.get(`/qc/${jobId}/${iteration}/${sample}`);
  return response.data;
};
