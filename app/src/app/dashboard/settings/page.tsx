'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserProfile } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Plus, Pencil, UserCog, Shield } from 'lucide-react'
import { formatDate } from '@/lib/utils'

const ROLE_COLORS: Record<string, any> = { admin: 'destructive', sales: 'info', accountant: 'success' }

export default function SettingsPage() {
    const supabase = createClient()
    const { toast } = useToast()
    const [users, setUsers] = useState<UserProfile[]>([])
    const [loading, setLoading] = useState(true)
    const [open, setOpen] = useState(false)
    const [editUser, setEditUser] = useState<UserProfile | null>(null)
    const [fullName, setFullName] = useState('')
    const [role, setRole] = useState<'admin' | 'sales' | 'accountant'>('sales')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [saving, setSaving] = useState(false)

    const fetchUsers = async () => {
        const { data } = await supabase.from('user_profiles').select('*').order('full_name')
        setUsers(data || [])
        setLoading(false)
    }
    useEffect(() => { fetchUsers() }, [])

    const openAdd = () => { setEditUser(null); setFullName(''); setEmail(''); setPassword(''); setRole('sales'); setOpen(true) }
    const openEdit = (u: UserProfile) => { setEditUser(u); setFullName(u.full_name); setRole(u.role); setEmail(u.email); setPassword(''); setOpen(true) }

    const handleSave = async () => {
        if (!fullName.trim()) return toast({ title: 'Error', description: 'Name is required', variant: 'destructive' })
        setSaving(true)

        if (editUser) {
            const { error } = await supabase.from('user_profiles').update({ full_name: fullName, role }).eq('id', editUser.id)
            if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' })
            else { toast({ title: 'User updated!' }); setOpen(false); fetchUsers() }
        } else {
            if (!email || !password) return toast({ title: 'Error', description: 'Email and password required', variant: 'destructive' })
            // Note: Creating users requires Supabase Admin API. Show info message.
            toast({
                title: 'Add users from Supabase Dashboard',
                description: 'Go to Authentication > Users in Supabase to invite new team members. Then update their role here.',
                variant: 'default'
            })
            setOpen(false)
        }
        setSaving(false)
    }

    return (
        <div className="space-y-5 fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><UserCog className="w-6 h-6 text-slate-500" />Settings & User Management</h1>
                    <p className="text-slate-500 text-sm">Manage team members and their roles</p>
                </div>
                <Button onClick={openAdd} className="bg-blue-600 hover:bg-blue-500"><Plus className="w-4 h-4 mr-2" />Add User</Button>
            </div>

            {/* System Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { role: 'Admin', desc: 'Full access: manage items, packs, hospitals, users, reports', icon: '🔐' },
                    { role: 'Sales', desc: 'View items, create quotations, view packs and hospitals', icon: '💼' },
                    { role: 'Accountant', desc: 'View pricing, export reports, view quotations', icon: '📊' },
                ].map(({ role, desc, icon }) => (
                    <Card key={role} className="border-0 shadow-sm">
                        <CardContent className="p-4">
                            <div className="text-2xl mb-2">{icon}</div>
                            <p className="font-semibold text-slate-700">{role}</p>
                            <p className="text-xs text-slate-500 mt-1">{desc}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold text-slate-700 flex items-center gap-2">
                        <Shield className="w-4 h-4" />Team Members ({users.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-400">Loading...</TableCell></TableRow>
                            ) : users.length === 0 ? (
                                <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-400">No users found</TableCell></TableRow>
                            ) : users.map(u => (
                                <TableRow key={u.id}>
                                    <TableCell className="font-medium">{u.full_name}</TableCell>
                                    <TableCell className="text-slate-500">{u.email}</TableCell>
                                    <TableCell><Badge variant={ROLE_COLORS[u.role] || 'secondary'} className="capitalize">{u.role}</Badge></TableCell>
                                    <TableCell className="text-slate-500">{formatDate(u.created_at)}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => openEdit(u)}><Pencil className="w-4 h-4" /></Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>{editUser ? 'Edit User' : 'Add Team Member'}</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2"><Label>Full Name *</Label><Input value={fullName} onChange={e => setFullName(e.target.value)} /></div>
                        {!editUser && (
                            <>
                                <div className="space-y-2"><Label>Email *</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
                                    💡 <strong>Tip:</strong> Add users directly in <strong>Supabase Dashboard → Authentication → Users</strong>, then assign roles here.
                                </div>
                            </>
                        )}
                        <div className="space-y-2">
                            <Label>Role</Label>
                            <Select value={role} onValueChange={v => setRole(v as any)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="sales">Sales</SelectItem>
                                    <SelectItem value="accountant">Accountant</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-500">{saving ? 'Saving…' : editUser ? 'Update' : 'Add'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
