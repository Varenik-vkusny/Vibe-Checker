'use client';

import { useEffect, useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MoreHorizontal, Loader2, Trash2, UserCog, Ban, CheckCircle, Pencil, Copy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { updateUser, deleteUser, UserUpdate } from '@/services/admin';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface User {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    role: 'USER' | 'ADMIN';
    created_at: string;
    is_active: boolean;
}

export default function UsersPage() {
    const { t } = useLanguage();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [isBanConfirmOpen, setIsBanConfirmOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    // Edit form state
    const [editForm, setEditForm] = useState({ first_name: '', last_name: '', email: '' });

    const fetchUsers = async () => {
        try {
            const res = await api.get<User[]>('/admin/users');
            setUsers(res.data);
        } catch (err) {
            console.error("Failed to fetch users", err);
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleRoleChange = async (userId: number, newRole: 'USER' | 'ADMIN') => {
        try {
            await updateUser(userId, { role: newRole });
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
            toast.success(`User role updated to ${newRole}`);
        } catch (err) {
            console.error(err);
            toast.error("Failed to update role");
        }
    };

    const handleBanToggle = async () => {
        if (!selectedUser) return;
        try {
            const newState = !selectedUser.is_active;
            await updateUser(selectedUser.id, { is_active: newState });
            setUsers(users.map(u => u.id === selectedUser.id ? { ...u, is_active: newState } : u));
            toast.success(newState ? t.admin.usersPage.unban : t.admin.usersPage.ban);
        } catch (err) {
            console.error(err);
            toast.error("Failed to update status");
        } finally {
            setIsBanConfirmOpen(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedUser) return;
        try {
            await deleteUser(selectedUser.id);
            setUsers(users.filter(u => u.id !== selectedUser.id));
            toast.success("User deleted");
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete user");
        } finally {
            setIsDeleteConfirmOpen(false);
        }
    };

    const openEditDialog = (user: User) => {
        setEditingUser(user);
        setEditForm({
            first_name: user.first_name,
            last_name: user.last_name || '',
            email: user.email
        });
        setIsEditDialogOpen(true);
    };

    const handleEditSubmit = async () => {
        if (!editingUser) return;
        try {
            await updateUser(editingUser.id, editForm);
            setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...editForm } : u));
            setIsEditDialogOpen(false);
            toast.success("User updated");
        } catch (err) {
            console.error(err);
            toast.error("Failed to update user");
        }
    };

    const confirmBan = (user: User) => {
        setSelectedUser(user);
        setIsBanConfirmOpen(true);
    };

    const confirmDelete = (user: User) => {
        setSelectedUser(user);
        setIsDeleteConfirmOpen(true);
    };

    if (loading) return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="animate-spin" size={32} /></div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">{t.admin.usersPage.title}</h1>
                <p className="text-zinc-500">{t.admin.usersPage.subtitle}</p>
            </div>

            <div className="rounded-md border border-zinc-200 dark:border-zinc-800">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[300px]">{t.admin.users}</TableHead>
                            <TableHead>{t.admin.usersPage.role}</TableHead>
                            <TableHead>{t.admin.usersPage.status}</TableHead>
                            <TableHead>{t.admin.usersPage.joined}</TableHead>
                            <TableHead className="text-right">{t.admin.usersPage.actions}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.email}`} />
                                            <AvatarFallback>{user.first_name[0]}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-zinc-900 dark:text-zinc-100">{user.first_name} {user.last_name || ''}</span>
                                            <span className="text-xs text-zinc-500">{user.email}</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'} className={user.role === 'ADMIN' ? 'bg-blue-600 hover:bg-blue-700' : ''}>
                                        {user.role}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={user.is_active ? "text-emerald-500 border-emerald-500/20 bg-emerald-500/10" : "text-red-500 border-red-500/20 bg-red-500/10"}>
                                        {user.is_active ? t.admin.usersPage.active : t.admin.usersPage.banned}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-zinc-500">
                                    {new Date(user.created_at || Date.now()).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">Open menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>{t.admin.usersPage.actions}</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => {
                                                navigator.clipboard.writeText(user.email);
                                                toast.success(t.admin.usersPage.emailCopied);
                                            }}>
                                                <Copy className="mr-2 h-4 w-4" />
                                                {t.admin.usersPage.copyEmail}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => openEditDialog(user)}>
                                                <Pencil className="mr-2 h-4 w-4" />
                                                {t.admin.usersPage.edit}
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => handleRoleChange(user.id, user.role === 'ADMIN' ? 'USER' : 'ADMIN')}>
                                                <UserCog className="mr-2 h-4 w-4" />
                                                {user.role === 'ADMIN' ? t.admin.usersPage.demote : t.admin.usersPage.promote}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => confirmBan(user)} className={user.is_active ? "text-orange-500" : "text-emerald-500"}>
                                                {user.is_active ? <Ban className="mr-2 h-4 w-4" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                                                {user.is_active ? t.admin.usersPage.ban : t.admin.usersPage.unban}
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => confirmDelete(user)} className="text-red-600">
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                {t.admin.usersPage.delete}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t.admin.usersPage.edit}</DialogTitle>
                        <DialogDescription>
                            {t.admin.usersPage.editDescription}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="first_name" className="text-right">
                                {t.admin.usersPage.firstName}
                            </Label>
                            <Input
                                id="first_name"
                                value={editForm.first_name}
                                onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="last_name" className="text-right">
                                {t.admin.usersPage.lastName}
                            </Label>
                            <Input
                                id="last_name"
                                value={editForm.last_name}
                                onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email" className="text-right">
                                {t.admin.usersPage.email}
                            </Label>
                            <Input
                                id="email"
                                value={editForm.email}
                                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => setIsEditDialogOpen(false)}>{t.common.cancel}</Button>
                        <Button type="submit" onClick={handleEditSubmit}>{t.admin.usersPage.saveChanges}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t.admin.usersPage.deleteConfirmTitle}</DialogTitle>
                        <DialogDescription>
                            {t.admin.usersPage.deleteConfirmDescription}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>
                            {t.common.cancel}
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            {t.common.delete}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isBanConfirmOpen} onOpenChange={setIsBanConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {selectedUser?.is_active ? t.admin.usersPage.banConfirmTitle : t.admin.usersPage.unbanConfirmTitle}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedUser?.is_active ? t.admin.usersPage.banConfirmDescription : t.admin.usersPage.unbanConfirmDescription}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setIsBanConfirmOpen(false)}>
                            {t.common.cancel}
                        </Button>
                        <Button
                            variant={selectedUser?.is_active ? "destructive" : "default"}
                            onClick={handleBanToggle}
                        >
                            {selectedUser?.is_active ? t.admin.usersPage.ban : t.admin.usersPage.unban}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
