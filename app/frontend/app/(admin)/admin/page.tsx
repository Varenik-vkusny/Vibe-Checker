'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getDashboardStats, DashboardData } from '@/services/admin';
import { Activity, Database, Users, Server, ArrowUpRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    getDashboardStats().then(setData).catch(console.error);
  }, []);

  if (!data) return <div className="p-8">Loading Dashboard...</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">System Status</h1>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">DB Status</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
                {data.stats.db_status ? (
                    <span className="text-green-500 flex items-center gap-2">● Healthy</span>
                ) : (
                    <span className="text-red-500">● Error</span>
                )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.total_users}</div>
            <p className="text-xs text-muted-foreground">Registered accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Backup</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.last_backup}</div>
            <p className="text-xs text-muted-foreground">Automated system</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.active_tasks}</div>
            <p className="text-xs text-muted-foreground">Parsing processes</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart Section */}
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Service Dynamics</CardTitle>
          <p className="text-sm text-muted-foreground">
            Quality has improved by <span className="font-bold text-green-500">20%</span> over the last month.
          </p>
        </CardHeader>
        <CardContent className="pl-2">
          <div className="h-[350px] w-full">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.chart_data}>
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
                         tickFormatter={(value) => `$${value}`} 
                    />
                    <Tooltip 
                        contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                        cursor={{fill: 'var(--muted)'}}
                    />
                    <Bar dataKey="value" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
                </BarChart>
             </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}