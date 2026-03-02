'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Hospital } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Plus, Pencil, Trash2, Search, Building2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'

const EMPTY = { name: '', address: '', contact_person: '', phone: '', pricing_type: 'standard' as 'standard' | 'custom', credit_period: '30' }

export default function HospitalsPage() {
    const supabase = createClient()
    const { toast } = useToast()
    const [hospitals, setHospitals] = useState<Hospital[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [open, setOpen] = useState(false)
    const [editItem, setEditItem] = useState<Hospital | null>(null)
    const [form, setForm] = useState(EMPTY)
    const [saving, setSaving] = useState(false)
    const [deleteId, setDeleteId] = useState<string | null>(null)

    const fetchHospitals = async () => {
        const { data } = await supabase.from('hospitals').select('*').order('name')
        setHospitals(data || [])
        setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchHospitals() }, [])

    const openAdd = () => { setEditItem(null); setForm(EMPTY); setOpen(true) }
    const openEdit = (h: Hospital) => {
        setEditItem(h)
        setForm({ name: h.name, address: h.address || '', contact_person: h.contact_person || '', phone: h.phone || '', pricing_type: h.pricing_type, credit_period: String(h.credit_period || 30) })
        setOpen(true)
    }

    const handleSave = async () => {
        if (!form.name.trim()) return toast({ title: 'Error', description: 'Hospital name is required', variant: 'destructive' })
        setSaving(true)
        const payload = { name: form.name, address: form.address || null, contact_person: form.contact_person || null, phone: form.phone || null, pricing_type: form.pricing_type, credit_period: Number(form.credit_period) }
        const op = editItem
            ? supabase.from('hospitals').update(payload).eq('id', editItem.id)
            : supabase.from('hospitals').insert(payload)
        const { error } = await op
        if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' })
        else { toast({ title: editItem ? 'Hospital updated!' : 'Hospital added!' }); setOpen(false); fetchHospitals() }
        setSaving(false)
    }

    const handleDelete = async (id: string) => {
        await supabase.from('hospitals').delete().eq('id', id)
        toast({ title: 'Hospital deleted' }); setDeleteId(null); fetchHospitals()
    }

    const filtered = hospitals.filter(h => [h.name, h.contact_person, h.phone].some(v => v?.toLowerCase().includes(search.toLowerCase())))

    return (
        <div className="space-y-5 fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Building2 className="w-6 h-6 text-emerald-500" /> Hospitals
                    </h1>
                    <p className="text-slate-500 text-sm">{hospitals.length} hospitals</p>
                </div>
                <Button onClick={openAdd} className="bg-blue-600 hover:bg-blue-500"><Plus className="w-4 h-4 mr-2" />Add Hospital</Button>
            </div>

            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                    <div className="relative max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input placeholder="Search hospitals..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Hospital Name</TableHead>
                                <TableHead>Contact Person</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Pricing</TableHead>
                                <TableHead>Credit (days)</TableHead>
                                <TableHead>Added</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-400">Loading...</TableCell></TableRow>
                            ) : filtered.length === 0 ? (
                                <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-400">No hospitals found</TableCell></TableRow>
                            ) : filtered.map(h => (
                                <TableRow key={h.id}>
                                    <TableCell className="font-medium">{h.name}</TableCell>
                                    <TableCell className="text-slate-500">{h.contact_person || '—'}</TableCell>
                                    <TableCell className="text-slate-500">{h.phone || '—'}</TableCell>
                                    <TableCell>
                                        <Badge variant={h.pricing_type === 'custom' ? 'info' : 'secondary'}>{h.pricing_type}</Badge>
                                    </TableCell>
                                    <TableCell>{h.credit_period} days</TableCell>
                                    <TableCell className="text-slate-500">{formatDate(h.created_at)}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(h)}><Pencil className="w-4 h-4" /></Button>
                                            <Button variant="ghost" size="icon" className="text-red-500" onClick={() => setDeleteId(h.id)}><Trash2 className="w-4 h-4" /></Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader><DialogTitle>{editItem ? 'Edit Hospital' : 'Add Hospital'}</DialogTitle></DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-2">
                        <div className="col-span-2 space-y-2"><Label>Hospital Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                        <div className="col-span-2 space-y-2"><Label>Address</Label><Textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} rows={2} /></div>
                        <div className="space-y-2"><Label>Contact Person</Label><Input value={form.contact_person} onChange={e => setForm({ ...form, contact_person: e.target.value })} /></div>
                        <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                        <div className="space-y-2">
                            <Label>Pricing Type</Label>
                            <Select value={form.pricing_type} onValueChange={v => setForm({ ...form, pricing_type: v as 'standard' | 'custom' })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="standard">Standard</SelectItem>
                                    <SelectItem value="custom">Custom</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2"><Label>Credit Period (days)</Label><Input type="number" min="0" value={form.credit_period} onChange={e => setForm({ ...form, credit_period: e.target.value })} /></div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-500">{saving ? 'Saving…' : editItem ? 'Update' : 'Add'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <DialogContent className="max-w-sm">
                    <DialogHeader><DialogTitle>Delete Hospital?</DialogTitle></DialogHeader>
                    <p className="text-sm text-slate-500">All custom pricing for this hospital will also be deleted.</p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={() => deleteId && handleDelete(deleteId)}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
