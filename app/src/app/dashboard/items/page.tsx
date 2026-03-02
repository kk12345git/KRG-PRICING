'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Item, Category } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Plus, Pencil, Trash2, Search, Package } from 'lucide-react'
import { formatCurrency, calculateMargin, generateSKU } from '@/lib/utils'

const EMPTY_FORM = {
    name: '', sku: '', category_id: '', purchase_price: '', selling_price: '',
    gst_percent: '12', vendor: '', status: 'active' as const,
}

export default function ItemsPage() {
    const supabase = createClient()
    const { toast } = useToast()
    const [items, setItems] = useState<Item[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('all')
    const [open, setOpen] = useState(false)
    const [editItem, setEditItem] = useState<Item | null>(null)
    const [form, setForm] = useState(EMPTY_FORM)
    const [saving, setSaving] = useState(false)
    const [deleteId, setDeleteId] = useState<string | null>(null)

    const margin = form.purchase_price && form.selling_price
        ? calculateMargin(Number(form.purchase_price), Number(form.selling_price))
        : 0

    const fetchData = async () => {
        const [{ data: items }, { data: cats }] = await Promise.all([
            supabase.from('items').select('*, category:categories(*)').order('name'),
            supabase.from('categories').select('*').order('name'),
        ])
        setItems(items || [])
        setCategories(cats || [])
        setLoading(false)
    }

    useEffect(() => { fetchData() }, [])

    const openAdd = () => { setEditItem(null); setForm(EMPTY_FORM); setOpen(true) }
    const openEdit = (item: Item) => {
        setEditItem(item)
        setForm({
            name: item.name, sku: item.sku, category_id: item.category_id || '',
            purchase_price: String(item.purchase_price), selling_price: String(item.selling_price),
            gst_percent: String(item.gst_percent), vendor: item.vendor || '', status: item.status,
        })
        setOpen(true)
    }

    const handleSave = async () => {
        if (!form.name.trim()) return toast({ title: 'Error', description: 'Item name is required', variant: 'destructive' })
        if (Number(form.selling_price) <= 0) return toast({ title: 'Error', description: 'Selling price must be positive', variant: 'destructive' })
        const gst = Number(form.gst_percent)
        if (gst < 0 || gst > 28) return toast({ title: 'Error', description: 'GST must be 0-28%', variant: 'destructive' })

        setSaving(true)
        const payload = {
            name: form.name, sku: form.sku || generateSKU(form.name),
            category_id: form.category_id || null,
            purchase_price: Number(form.purchase_price), selling_price: Number(form.selling_price),
            gst_percent: gst, vendor: form.vendor || null, status: form.status,
        }
        if (editItem) {
            const { error } = await supabase.from('items').update(payload).eq('id', editItem.id)
            if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' })
            else { toast({ title: 'Item updated!' }); setOpen(false); fetchData() }
        } else {
            const { error } = await supabase.from('items').insert(payload)
            if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' })
            else { toast({ title: 'Item added!' }); setOpen(false); fetchData() }
        }
        setSaving(false)
    }

    const handleDelete = async (id: string) => {
        const { error } = await supabase.from('items').delete().eq('id', id)
        if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' })
        else { toast({ title: 'Item deleted' }); fetchData() }
        setDeleteId(null)
    }

    const filtered = items.filter(i =>
        (i.name.toLowerCase().includes(search.toLowerCase()) || i.sku?.toLowerCase().includes(search.toLowerCase())) &&
        (categoryFilter === 'all' || i.category_id === categoryFilter)
    )

    return (
        <div className="space-y-5 fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Package className="w-6 h-6 text-blue-500" /> Items
                    </h1>
                    <p className="text-slate-500 text-sm">{items.length} items in catalog</p>
                </div>
                <Button onClick={openAdd} id="add-item-btn" className="bg-blue-600 hover:bg-blue-500">
                    <Plus className="w-4 h-4 mr-2" /> Add Item
                </Button>
            </div>

            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input placeholder="Search by name or SKU..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
                        </div>
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="w-48"><SelectValue placeholder="All Categories" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Item Name</TableHead>
                                <TableHead>SKU</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Purchase</TableHead>
                                <TableHead>Selling</TableHead>
                                <TableHead>GST%</TableHead>
                                <TableHead>Margin%</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={9} className="text-center text-slate-400 py-8">Loading...</TableCell></TableRow>
                            ) : filtered.length === 0 ? (
                                <TableRow><TableCell colSpan={9} className="text-center text-slate-400 py-8">No items found</TableCell></TableRow>
                            ) : filtered.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium text-slate-800">{item.name}</TableCell>
                                    <TableCell className="text-slate-500 font-mono text-xs">{item.sku}</TableCell>
                                    <TableCell>{(item.category as any)?.name || '—'}</TableCell>
                                    <TableCell>{formatCurrency(item.purchase_price)}</TableCell>
                                    <TableCell className="font-semibold">{formatCurrency(item.selling_price)}</TableCell>
                                    <TableCell>{item.gst_percent}%</TableCell>
                                    <TableCell>
                                        <span className={`font-semibold ${item.margin_percent >= 20 ? 'text-green-600' : item.margin_percent >= 10 ? 'text-yellow-600' : 'text-red-500'}`}>
                                            {item.margin_percent?.toFixed(1)}%
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={item.status === 'active' ? 'success' : 'secondary'}>
                                            {item.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Pencil className="w-4 h-4" /></Button>
                                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700" onClick={() => setDeleteId(item.id)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Add/Edit Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader><DialogTitle>{editItem ? 'Edit Item' : 'Add Item'}</DialogTitle></DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-2">
                        <div className="col-span-2 space-y-2">
                            <Label>Item Name *</Label>
                            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., Surgical Gloves Medium" />
                        </div>
                        <div className="space-y-2">
                            <Label>SKU Code</Label>
                            <Input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} placeholder="Auto-generated if empty" />
                        </div>
                        <div className="space-y-2">
                            <Label>Category</Label>
                            <Select value={form.category_id} onValueChange={v => setForm({ ...form, category_id: v })}>
                                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                                <SelectContent>
                                    {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Purchase Price (₹) *</Label>
                            <Input type="number" min="0" step="0.01" value={form.purchase_price}
                                onChange={e => setForm({ ...form, purchase_price: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Selling Price (₹) *</Label>
                            <Input type="number" min="0" step="0.01" value={form.selling_price}
                                onChange={e => setForm({ ...form, selling_price: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>GST % (0–28)</Label>
                            <Input type="number" min="0" max="28" step="0.5" value={form.gst_percent}
                                onChange={e => setForm({ ...form, gst_percent: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Margin (auto-calculated)</Label>
                            <div className={`h-10 flex items-center px-3 rounded-md border text-sm font-semibold ${margin >= 20 ? 'text-green-700 border-green-300 bg-green-50' : margin >= 10 ? 'text-yellow-700 border-yellow-300 bg-yellow-50' : 'text-red-600 border-red-300 bg-red-50'}`}>
                                {margin.toFixed(2)}%
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Vendor</Label>
                            <Input value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value })} placeholder="Vendor name" />
                        </div>
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={form.status} onValueChange={v => setForm({ ...form, status: v as any })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-500">
                            {saving ? 'Saving…' : editItem ? 'Update Item' : 'Add Item'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <DialogContent className="max-w-sm">
                    <DialogHeader><DialogTitle>Delete Item?</DialogTitle></DialogHeader>
                    <p className="text-sm text-slate-500">This will permanently delete the item from the catalog.</p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={() => deleteId && handleDelete(deleteId)}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
