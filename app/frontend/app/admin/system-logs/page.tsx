'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Download, Trash, RefreshCw } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function LogsPage() {
    const [logs, setLogs] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await api.get<string[]>('/admin/logs?limit=100');
            if (Array.isArray(res.data)) {
                setLogs(res.data);
            } else {
                console.error("Unexpected logs format:", res.data);
                setLogs([]);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const handleClear = async () => {
        if (!confirm("Are you sure you want to clear system logs?")) return;
        try {
            await api.delete('/admin/logs/clear');
            setLogs([]);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 h-[calc(100vh-8rem)] flex flex-col">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">System Logs</h1>
                    <p className="text-zinc-500">Live system events and debug information.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => window.open('/api/admin/logs/download', '_blank')}>
                        <Download className="mr-2 h-4 w-4" />
                        Download
                    </Button>
                    <Button variant="destructive" size="sm" onClick={handleClear}>
                        <Trash className="mr-2 h-4 w-4" />
                        Clear
                    </Button>
                </div>
            </div>

            <div className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-950 p-4 font-mono text-sm text-zinc-300 shadow-inner overflow-hidden">
                <ScrollArea className="h-full w-full">
                    {!Array.isArray(logs) || logs.length === 0 ? (
                        <div className="text-zinc-500 italic">No logs available.</div>
                    ) : (
                        logs.map((log, i) => (
                            <div key={i} className="whitespace-pre-wrap border-b border-zinc-900/50 py-0.5 hover:bg-zinc-900/50">
                                {log}
                            </div>
                        ))
                    )}
                </ScrollArea>
            </div>
        </div>
    );
}
