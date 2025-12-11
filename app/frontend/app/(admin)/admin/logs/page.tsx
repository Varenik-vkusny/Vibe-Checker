'use client';
import { useEffect, useState, useRef } from 'react';
import { getSystemLogs, clearSystemLogs } from '@/services/admin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Trash2, Pause, Play } from 'lucide-react';
import api from '@/lib/api';

export default function LogsPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchLogs = async () => {
    if (isPaused) return;
    try {
      const data = await getSystemLogs(100);
      setLogs(data);
    } catch (e) {
      console.error("Failed to fetch logs", e);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 3000); 
    return () => clearInterval(interval);
  }, [isPaused]);

  useEffect(() => {
    if (scrollRef.current && !isPaused) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isPaused]);

  const handleDownload = () => {
      window.open('http://127.0.0.1:8000/admin/logs/download', '_blank');
  };

  const handleClear = async () => {
      if(confirm('Are you sure you want to clear system logs?')) {
          await clearSystemLogs();
          setLogs([]);
      }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">System Logs</h1>
        <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsPaused(!isPaused)}>
                {isPaused ? <Play className="w-4 h-4 mr-2"/> : <Pause className="w-4 h-4 mr-2"/>}
                {isPaused ? "Resume" : "Pause"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2"/> Download .txt
            </Button>
            <Button variant="destructive" size="sm" onClick={handleClear}>
                <Trash2 className="w-4 h-4 mr-2"/> Clear Cache
            </Button>
        </div>
      </div>

      <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader className="py-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="ml-2 text-zinc-400 text-xs font-mono">root@vibecheck-server:~ logs/system.log</span>
              </div>
          </CardHeader>
          <CardContent className="p-0">
              <div 
                ref={scrollRef}
                className="h-[600px] overflow-y-auto p-4 font-mono text-xs md:text-sm text-green-400 space-y-1 scrollbar-thin scrollbar-thumb-zinc-700"
              >
                  {logs.length === 0 && <span className="text-zinc-500 opacity-50">No logs available or waiting for server...</span>}
                  {logs.map((log, i) => (
                      <div key={i} className="break-all border-l-2 border-transparent hover:border-zinc-700 hover:bg-zinc-900/50 pl-2">
                          <span className="opacity-50 select-none mr-2">[{i + 1}]</span>
                          {log}
                      </div>
                  ))}
              </div>
          </CardContent>
      </Card>
    </div>
  );
}