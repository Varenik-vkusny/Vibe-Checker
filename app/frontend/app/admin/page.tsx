'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Activity, HardDrive, Cpu, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '@/lib/api';

interface DashboardStats {
    db_status: boolean;
    last_backup: string;
    total_users: number;
    active_tasks: number;
}

interface ChartPoint {
    name: string;
    value: number;
}

interface DashboardData {
    stats: DashboardStats;
    chart_data: ChartPoint[];
}

export default function AdminDashboard() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get<DashboardData>('/admin/stats');
                setData(res.data);
            } catch (err) {
                console.error("Failed to fetch dashboard stats", err);
                setError("Failed to load dashboard data.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="animate-spin text-zinc-400" size={32} /></div>;
    }

    if (error || !data) {
        return <div className="text-red-500">{error || "No data available"}</div>;
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Dashboard</h1>
                <p className="text-zinc-500 dark:text-zinc-400">System overview and performance metrics.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Total Users */}
                <Card className="border-border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-zinc-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.stats.total_users}</div>
                        <p className="text-xs text-muted-foreground">+20.1% from last month</p>
                    </CardContent>
                </Card>

                {/* Analyses Today (Mocked as we don't have this in API yet, user mentioned it but API has tasks) */}
                <Card className="border-border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Active Tasks</CardTitle>
                        <Cpu className="h-4 w-4 text-zinc-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.stats.active_tasks}</div>
                        <p className="text-xs text-muted-foreground">Currently processing</p>
                    </CardContent>
                </Card>

                {/* Database Health */}
                <Card className="border-border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Database Status</CardTitle>
                        <HardDrive className="h-4 w-4 text-zinc-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <div className={`h-2.5 w-2.5 rounded-full ${data.stats.db_status ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
                            <span className="text-2xl font-bold">{data.stats.db_status ? 'Online' : 'Offline'}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Last backup: {data.stats.last_backup}</p>
                    </CardContent>
                </Card>

                {/* System Activity (Mocked KPI) */}
                <Card className="border-border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">System Load</CardTitle>
                        <Activity className="h-4 w-4 text-zinc-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">98.2%</div>
                        <p className="text-xs text-muted-foreground">Operational uptime</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Chart */}
            <Card className="col-span-4 border-border shadow-sm">
                <CardHeader>
                    <CardTitle>Weekly Activity</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.chart_data}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" strokeOpacity={0.1} vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `${value}`}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderRadius: '8px' }}
                                    itemStyle={{ color: 'var(--color-foreground)' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                    dot={{ r: 4, fill: 'var(--color-background)', strokeWidth: 2 }}
                                    activeDot={{ r: 6 }}
                                    className="stroke-zinc-900 dark:stroke-white"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
