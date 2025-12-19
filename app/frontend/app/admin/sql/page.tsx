'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Copy, AlertTriangle } from 'lucide-react';
import { executeSql } from '@/services/admin';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function SqlPage() {
    const { t } = useLanguage();
    const [query, setQuery] = useState('');
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleExecute = async () => {
        if (!query.trim()) return;
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const res = await executeSql(query);
            if (res.data.status === 'error') {
                setError(res.data.error);
            } else {
                setResult(res.data);
                toast.success("Query executed successfully");
            }
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.detail || err.message || "Failed to execute query");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">{t.admin.sql.title}</h1>
                <p className="text-zinc-500">{t.admin.sql.subtitle}</p>
            </div>

            <Card className="border-border">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Terminal className="h-5 w-5" />
                        Console
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Textarea
                        placeholder={t.admin.sql.placeholder}
                        className="font-mono min-h-[150px] bg-zinc-950 text-zinc-100 resize-y"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.ctrlKey) {
                                handleExecute();
                            }
                        }}
                    />
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setQuery('')}>{t.admin.sql.clear}</Button>
                        <Button onClick={handleExecute} disabled={loading}>
                            {loading ? <span className="animate-spin mr-2">⏳</span> : null}
                            {t.admin.sql.execute} (Ctrl+Enter)
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {error && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription className="font-mono text-xs mt-2 whitespace-pre-wrap">
                        {error}
                    </AlertDescription>
                </Alert>
            )}

            {result && result.rows && (
                <Card className="border-border overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between py-3 bg-zinc-50 dark:bg-zinc-900/50">
                        <div className="text-sm text-zinc-500 font-mono">
                            {result.rows.length} rows returned
                        </div>
                    </CardHeader>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {result.columns.map((col: string) => (
                                        <TableHead key={col} className="font-mono text-xs whitespace-nowrap">{col}</TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {result.rows.map((row: any[], i: number) => (
                                    <TableRow key={i}>
                                        {row.map((cell: any, j: number) => (
                                            <TableCell key={j} className="font-mono text-xs whitespace-nowrap max-w-[300px] truncate">
                                                {cell === null ? <span className="text-zinc-400">NULL</span> : String(cell)}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            )}

            {result && result.rows_affected !== undefined && (
                <Alert className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                    <AlertTitle>Success</AlertTitle>
                    <AlertDescription>
                        Rows affected: {result.rows_affected}
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}
