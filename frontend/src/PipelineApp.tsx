import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { uploadReads, uploadReference, createJob, runPipeline, getLogs, getQCReports } from './api';
import { Loader2, CheckCircle, XCircle, FileText, Play, ExternalLink, BarChart2, Scissors, Activity, Terminal, ChevronDown, ChevronUp } from 'lucide-react';
import { QCSummary } from './components/QCSummary';

function App() {
  const [sampleName, setSampleName] = useState('');
  const [r1File, setR1File] = useState<File | null>(null);
  const [r2File, setR2File] = useState<File | null>(null);
  const [refFile, setRefFile] = useState<File | null>(null);
  const [stage, setStage] = useState('full');
  const [qual, setQual] = useState(20);
  const [minLen, setMinLen] = useState(36);

  const [jobId, setJobId] = useState<string | null>(null);
  const [iteration, setIteration] = useState<number>(0);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'running' | 'completed' | 'error'>('idle');
  const [logs, setLogs] = useState<string>('');
  const [reports, setReports] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [showLogs, setShowLogs] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (showLogs) {
        scrollToBottom();
    }
  }, [logs, showLogs]);

  useEffect(() => {
    if (reports) {
      const summaryKey = Object.keys(reports).find(k => k.includes('Summary JSON'));
      if (summaryKey) {
        setSelectedReport(summaryKey);
      } else {
        const firstKey = Object.keys(reports)[0];
        if (firstKey) setSelectedReport(firstKey);
      }
    }
  }, [reports]);

  useEffect(() => {
    let interval: any;

    if (status === 'running' && jobId && iteration > 0) {
      interval = setInterval(async () => {
        try {
          const data = await getLogs(jobId, iteration);
          if (data.logs) {
            setLogs((prev) => prev + data.logs);
          }
          if (data.done) {
            setStatus('completed');
            fetchReports();
          }
        } catch (err) {
          console.error("Error fetching logs", err);
        }
      }, 2000);
    }

    return () => clearInterval(interval);
  }, [status, jobId, iteration]);

  const fetchReports = async () => {
    if (!jobId || iteration === 0) return;
    try {
      const data = await getQCReports(jobId, iteration, sampleName);
      setReports(data.reports);
    } catch (err) {
      console.error("Error fetching reports", err);
    }
  };

  const handleRun = async () => {
    if (!sampleName || !r1File || !r2File) {
      setError("Please provide sample name and read files.");
      return;
    }
    if (stage === 'full' && !refFile) {
      setError("Reference file is required for full stage.");
      return;
    }

    setError(null);
    setStatus('uploading');
    setLogs('');
    setReports(null);

    try {
      // 1. Create Job
      const jobData = await createJob();
      const newJobId = jobData.job_id;
      setJobId(newJobId);

      // 2. Upload Reads
      const readsData = await uploadReads(sampleName, r1File, r2File);
      const readsPattern = readsData.pattern;

      // 3. Upload Reference (if needed)
      let refPath = undefined;
      if (refFile) {
        const refData = await uploadReference(refFile);
        refPath = refData.reference;
      }

      // 4. Run Pipeline
      setStatus('running');
      const runData = await runPipeline(newJobId, {
        stage,
        qual,
        min_len: minLen,
        reads_pattern: readsPattern,
        ref_path: refPath
      });
      
      setIteration(runData.iteration);

    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || "An error occurred");
      setStatus('error');
    }
  };

  const getReportIcon = (name: string) => {
    if (name.includes('Summary')) return <Activity className="h-4 w-4 text-blue-500" />;
    if (name.includes('fastp') || name.includes('Trimmed')) return <Scissors className="h-4 w-4 text-orange-500" />;
    if (name.includes('falco') || name.includes('fastqc')) return <BarChart2 className="h-4 w-4 text-purple-500" />;
    return <FileText className="h-4 w-4 text-gray-500" />;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="w-full max-w-[1800px] mx-auto space-y-6">
        <div className="flex items-center justify-between bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-md">
                <Activity className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Bioinformatics Pipeline</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 px-4 py-2 bg-gray-50 rounded-full border">
                {status === 'running' && <Loader2 className="animate-spin text-blue-500 h-4 w-4" />}
                {status === 'completed' && <CheckCircle className="text-green-500 h-4 w-4" />}
                {status === 'error' && <XCircle className="text-red-500 h-4 w-4" />}
                <span className="font-medium capitalize text-sm">{status === 'idle' ? 'Ready' : status}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Configuration Panel - Left Column */}
          <div className="col-span-12 lg:col-span-3 space-y-6">
          <Card className="border-t-4 border-t-blue-600 shadow-sm">
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
              <CardDescription>Set up your analysis parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sample">Sample Name</Label>
                <Input 
                  id="sample" 
                  placeholder="e.g., sample_01" 
                  value={sampleName}
                  onChange={(e) => setSampleName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="r1">Read 1 (R1)</Label>
                <Input 
                  id="r1" 
                  type="file" 
                  onChange={(e) => setR1File(e.target.files?.[0] || null)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="r2">Read 2 (R2)</Label>
                <Input 
                  id="r2" 
                  type="file" 
                  onChange={(e) => setR2File(e.target.files?.[0] || null)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ref">Reference Genome</Label>
                <Input 
                  id="ref" 
                  type="file" 
                  accept=".fa,.fna,.fasta"
                  onChange={(e) => setRefFile(e.target.files?.[0] || null)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stage">Pipeline Stage</Label>
                <Select 
                  id="stage" 
                  value={stage} 
                  onChange={(e) => setStage(e.target.value)}
                >
                  <option value="full">Full Pipeline</option>
                  <option value="qc_only">QC Only</option>
                  <option value="trim_qc">Trim & QC</option>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="qual">Min Quality</Label>
                  <Input 
                    id="qual" 
                    type="number" 
                    value={qual}
                    onChange={(e) => setQual(parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minLen">Min Length</Label>
                  <Input 
                    id="minLen" 
                    type="number" 
                    value={minLen}
                    onChange={(e) => setMinLen(parseInt(e.target.value))}
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md border border-red-100">
                  {error}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700" 
                onClick={handleRun} 
                disabled={status === 'uploading' || status === 'running'}
              >
                {status === 'uploading' ? 'Uploading...' : status === 'running' ? 'Running...' : (
                  <>
                    <Play className="mr-2 h-4 w-4" /> Start Analysis
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
          </div>

          {/* Results & Logs Panel - Right Column */}
          <div className="col-span-12 lg:col-span-9 space-y-6">
            {reports ? (
              <div className="grid grid-cols-12 gap-6 h-[800px]">
                {/* Report Sidebar */}
                <Card className="col-span-3 h-full overflow-hidden flex flex-col border shadow-sm">
                    <CardHeader className="py-4 px-4 border-b bg-gray-50">
                        <CardTitle className="text-base font-semibold text-gray-700">Available Reports</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto p-2 space-y-1 bg-gray-50/30">
                        {Object.entries(reports).map(([key]) => {
                            const label = key.replace('Summary JSON', 'Summary').replace(/[()]/g, '').trim();
                            const isActive = selectedReport === key;
                            
                            return (
                                <button
                                    key={key}
                                    onClick={() => setSelectedReport(key)}
                                    className={`w-full text-left px-3 py-3 rounded-md text-sm transition-all flex items-center space-x-3 ${
                                        isActive 
                                        ? 'bg-white text-blue-700 font-medium shadow-sm border border-blue-100 ring-1 ring-blue-50' 
                                        : 'hover:bg-white hover:shadow-sm text-gray-600 border border-transparent'
                                    }`}
                                >
                                    {getReportIcon(key)}
                                    <span className="truncate">{label}</span>
                                </button>
                            );
                        })}
                    </CardContent>
                </Card>

                {/* Report Detail */}
                <div className="col-span-9 h-full overflow-y-auto bg-white rounded-lg border shadow-sm">
                    {selectedReport && (
                        <div className="h-full">
                            {selectedReport.includes('Summary JSON') ? (
                                <div className="p-8">
                                    <QCSummary 
                                        title={selectedReport.replace('Summary JSON', '').replace(/[()]/g, '').trim()}
                                        url={`http://localhost:8000${reports[selectedReport]}`}
                                    />
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full bg-gray-50/50">
                                    <div className="text-center space-y-4 p-8 bg-white rounded-xl shadow-sm border max-w-md">
                                        <div className="bg-blue-50 p-4 rounded-full inline-block">
                                            <FileText className="h-12 w-12 text-blue-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-semibold text-gray-900">HTML Report Available</h3>
                                            <p className="text-gray-500 mt-2">
                                                This report contains detailed visualizations that are best viewed in a full window.
                                            </p>
                                        </div>
                                        <Button 
                                            onClick={() => window.open(`http://localhost:8000${reports[selectedReport]}`, '_blank')}
                                            className="w-full"
                                            variant="outline"
                                        >
                                            <ExternalLink className="mr-2 h-4 w-4" />
                                            Open Report in New Tab
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
              </div>
            ) : (
                /* Empty State / Initial Logs View */
                <div className="h-[600px] flex items-center justify-center border-2 border-dashed rounded-lg bg-gray-50">
                    {status === 'running' ? (
                        <div className="text-center space-y-4">
                            <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto" />
                            <p className="text-gray-500 font-medium">Pipeline is running...</p>
                            <p className="text-sm text-gray-400">Check the logs below for progress</p>
                        </div>
                    ) : (
                        <div className="text-center space-y-4">
                            <Activity className="h-12 w-12 text-gray-300 mx-auto" />
                            <p className="text-gray-500 font-medium">Ready to start analysis</p>
                            <p className="text-sm text-gray-400">Configure your parameters on the left and click Start</p>
                        </div>
                    )}
                </div>
            )}
          </div>
        </div>

        {/* Collapsible Logs Section */}
        <Card className="border shadow-sm">
            <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors border-b"
                onClick={() => setShowLogs(!showLogs)}
            >
                <div className="flex items-center space-x-2">
                    <Terminal className="h-5 w-5 text-gray-500" />
                    <h3 className="font-medium text-gray-900">Execution Logs</h3>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {status === 'running' ? 'Live' : status}
                    </span>
                </div>
                {showLogs ? <ChevronDown className="h-5 w-5 text-gray-400" /> : <ChevronUp className="h-5 w-5 text-gray-400" />}
            </div>
            
            {showLogs && (
                <CardContent className="p-0">
                    <div className="bg-slate-950 text-slate-300 font-mono text-xs p-4 h-[300px] overflow-auto whitespace-pre-wrap">
                        {logs || <span className="text-slate-600">// Logs will appear here...</span>}
                        <div ref={logsEndRef} />
                    </div>
                </CardContent>
            )}
        </Card>

      </div>
    </div>
  );
}

export default App;
