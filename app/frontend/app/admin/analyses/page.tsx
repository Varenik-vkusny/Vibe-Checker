'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2, ExternalLink } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { getAnalyses, deleteAnalysis, Analysis } from '@/services/admin';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export default function AnalysesPage() {
    const { t } = useLanguage();
    const [analyses, setAnalyses] = useState<Analysis[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const fetchAnalyses = async () => {
        try {
            const data = await getAnalyses();
            setAnalyses(data);
        } catch (err) {
            console.error("Failed to fetch analyses", err);
            toast.error("Failed to load analyses");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalyses();
    }, []);

    const handleDelete = (id: number) => {
        setDeleteId(id);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (deleteId === null) return;
        try {
            await deleteAnalysis(deleteId);
            setAnalyses(analyses.filter(a => a.id !== deleteId));
            toast.success("Analysis deleted");
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete analysis");
        } finally {
            setIsDeleteDialogOpen(false);
            setDeleteId(null);
        }
    };

    if (loading) return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="animate-spin" size={32} /></div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">{t.admin.analysesPage.title}</h1>
                <p className="text-zinc-500">{t.admin.analysesPage.subtitle}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {analyses.map((item) => (
                    <Card key={item.id} className="group relative border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20" onClick={() => handleDelete(item.id)}>
                                <Trash2 size={16} />
                            </Button>
                        </div>
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start pr-8">
                                <CardTitle className="text-lg truncate" title={item.place_name}>{item.place_name}</CardTitle>
                                <Badge variant="outline" className="font-mono text-xs shrink-0 ml-2">{item.score}/100</Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {/* Assuming summary has simplistic tags or data, adjust based on actual structure */}
                                {item.summary && item.summary.tags && Array.isArray(item.summary.tags) ? item.summary.tags.slice(0, 3).map((tag: any) => (
                                    <span key={tag} className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                                        {tag}
                                    </span>
                                )) : null}
                            </div>
                            <div className="text-xs text-zinc-400">
                                {t.admin.analysesPage.analyzed} {new Date(item.created_at).toLocaleString()}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {analyses.length === 0 && (
                <div className="text-center p-8 text-zinc-400 text-sm">
                    {t.admin.analysesPage.connectPrompt}
                </div>
            )}

            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t.admin.analysesPage.deleteConfirmTitle}</DialogTitle>
                        <DialogDescription>
                            {t.admin.analysesPage.deleteConfirmDescription}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                            {t.common.cancel}
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete}>
                            {t.common.delete}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
