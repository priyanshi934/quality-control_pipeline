import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';

interface QCResult {
  status: 'PASS' | 'WARN' | 'FAIL' | 'UNKNOWN';
  reason: string;
}

interface QCSummaryData {
  [key: string]: QCResult;
}

interface QCSummaryProps {
  url: string;
  title: string;
}

export function QCSummary({ url, title }: QCSummaryProps) {
  const [data, setData] = useState<QCSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch QC data');
        const json = await response.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url]);

  if (loading) return <div className="text-sm text-gray-500">Loading QC summary...</div>;
  if (error) return <div className="text-sm text-red-500">Error loading summary: {error}</div>;
  if (!data) return null;

  const counts = {
    PASS: Object.values(data).filter(i => i.status === 'PASS').length,
    WARN: Object.values(data).filter(i => i.status === 'WARN').length,
    FAIL: Object.values(data).filter(i => i.status === 'FAIL').length,
  };

  const getIcon = (status: string) => {
    switch (status) {
      case 'PASS': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'WARN': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'FAIL': return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <Info className="h-5 w-5 text-gray-400" />;
    }
  };

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'PASS': return 'default'; 
      case 'WARN': return 'secondary'; 
      case 'FAIL': return 'destructive';
      default: return 'outline';
    }
  };

  // Helper to format key names (e.g. per_base_sequence_quality -> Per Base Sequence Quality)
  const formatName = (key: string) => {
    return key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  // Sort keys to put FAIL/WARN first
  const sortedKeys = Object.keys(data).sort((a, b) => {
    const score = (s: string) => {
      if (s === 'FAIL') return 0;
      if (s === 'WARN') return 1;
      if (s === 'PASS') return 2;
      return 3;
    };
    return score(data[a].status) - score(data[b].status);
  });

  return (
    <Card className="h-full border-0 shadow-none">
      <CardHeader className="pb-4 px-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold">{title}</CardTitle>
          <div className="flex space-x-2">
             {counts.FAIL > 0 && <Badge variant="destructive">{counts.FAIL} Fails</Badge>}
             {counts.WARN > 0 && <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">{counts.WARN} Warnings</Badge>}
             <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">{counts.PASS} Passed</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-0">
        <div className="mb-4 flex justify-end">
            <button 
                onClick={() => setShowAll(!showAll)}
                className="text-xs text-blue-600 hover:underline"
            >
                {showAll ? "Hide Passing Metrics" : "Show All Metrics"}
            </button>
        </div>

        <div className="space-y-3">
          {sortedKeys.map((key) => {
            const item = data[key];
            if (!showAll && item.status === 'PASS') return null; 
            
            return (
              <div key={key} className={`flex items-start space-x-3 p-4 rounded-lg border ${
                  item.status === 'FAIL' ? 'bg-red-50 border-red-100' : 
                  item.status === 'WARN' ? 'bg-yellow-50 border-yellow-100' : 
                  'bg-white border-gray-100'
              }`}>
                <div className="mt-0.5">{getIcon(item.status)}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`font-medium ${
                        item.status === 'FAIL' ? 'text-red-900' : 
                        item.status === 'WARN' ? 'text-yellow-900' : 
                        'text-gray-900'
                    }`}>{formatName(key)}</span>
                    <Badge variant={getBadgeVariant(item.status) as any}>{item.status}</Badge>
                  </div>
                  <p className={`text-sm ${
                      item.status === 'FAIL' ? 'text-red-700' : 
                      item.status === 'WARN' ? 'text-yellow-700' : 
                      'text-gray-600'
                  }`}>{item.reason}</p>
                </div>
              </div>
            );
          })}
          
          {!showAll && counts.FAIL === 0 && counts.WARN === 0 && (
             <div className="flex flex-col items-center justify-center py-8 text-green-600 space-y-2 bg-green-50 rounded-lg border border-green-100">
                <CheckCircle className="h-8 w-8" />
                <span className="font-medium">All QC checks passed!</span>
                <span className="text-xs text-green-500">Click "Show All Metrics" to see details.</span>
             </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
