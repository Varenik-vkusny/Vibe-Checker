'use client';
import { useEffect, useState } from 'react';
import { getAdminUsers, updateUserRole } from '@/services/admin';
import { User, UserRole } from '@/types/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);

  const fetchUsers = async () => {
    try {
      const data = await getAdminUsers();
      setUsers(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (id: number, newRole: UserRole) => {
      await updateUserRole(id, newRole);
      fetchUsers(); 
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Database Roles</h1>
        <Button variant="outline" onClick={fetchUsers}>Refresh</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm text-left">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground">User</th>
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Role</th>
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Status</th>
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Last Active</th>
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Action</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {users.map((u) => (
                  <tr key={u.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle">
                        <div className="font-medium">{u.first_name} {u.last_name}</div>
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                    </td>
                    <td className="p-4 align-middle">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                            u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                            u.role === 'SERVICE' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                        }`}>
                            {u.role.toUpperCase()}
                        </span>
                    </td>
                    <td className="p-4 align-middle">
                        <span className="text-green-600 font-medium text-xs">Active</span>
                    </td>
                    <td className="p-4 align-middle text-muted-foreground">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Unknown'}
                    </td>
                    <td className="p-4 align-middle text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleRoleChange(u.id, 'ADMIN')}>Make Admin</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleRoleChange(u.id, 'SERVICE')}>Make Service</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleRoleChange(u.id, 'USER')}>Make User</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}