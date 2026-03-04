'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Pack, Item, PackItem } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { Plus, Pencil, Trash2, Search, Stethoscope, X, Copy } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface PackItemLocal { item: Item; quantity: number }

export default function PacksPage() {
    const supabase = createClient()
    const { toast } = useToast()
    const [packs, setPacks] = useState<Pack[]>([])
    const [items, setItems] = useState<Item[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [open, setOpen] = useState(false)
    const [editPack, setEditPack] = useState<Pack | null>(null)
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [packItems, setPackItems] = useState<PackItemLocal[]>([])
    const [itemSearch, setItemSearch] = useState('')
    const [saving, setSaving] = useState(false)
    const [deleteId, setDeleteId] = useState<string | null>(null)

    const totalCost = packItems.reduce((s, pi) => s + pi.item.purchase_price * pi.quantity, 0)
    const totalSelling = packItems.reduce((s, pi) => s + pi.item.selling_price * pi.quantity, 0)
    const marginPct = totalSelling > 0 ? ((totalSelling - totalCost) / totalSelling * 100) : 0

    const fetchData = async () => {
        const [{ data: packs }, { data: itemsData }] = await Promise.all([
            supabase.from('packs').select('*, pack_items(*, item:items(*))').order('name'),
            supabase.from('items').select('*').eq('status', 'active').order('name'),
        ])
        setPacks(packs || [])
        setItems(itemsData || [])
        setLoading(false)
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchData() }, [])

    const openAdd = () => { setEditPack(null); setName(''); setDescription(''); setPackItems([]); setOpen(true) }

    const openEdit = (pack: Pack) => {
        setEditPack(pack)
        setName(pack.name)
        setDescription(pack.description || '')
        const pis = (pack.pack_items || []).filter((pi): pi is PackItem & { item: Item } => !!pi.item).map(pi => ({ item: pi.item, quantity: pi.quantity }))
        setPackItems(pis)
        setOpen(true)
    }

    const openDuplicate = (pack: Pack) => {
        setEditPack(null)
        setName(pack.name + ' (Copy)')
        setDescription(pack.description || '')
        const pis = (pack.pack_items || []).filter((pi): pi is PackItem & { item: Item } => !!pi.item).map(pi => ({ item: pi.item, quantity: pi.quantity }))
        setPackItems(pis)
        setOpen(true)
    }

    const addItem = (item: Item) => {
        if (packItems.find(pi => pi.item.id === item.id)) return
        setPackItems([...packItems, { item, quantity: 1 }])
        setItemSearch('')
    }

    const updateQty = (itemId: string, qty: number) => {
        if (qty < 1) return
        setPackItems(packItems.map(pi => pi.item.id === itemId ? { ...pi, quantity: qty } : pi))
    }

    const removeItem = (itemId: string) => setPackItems(packItems.filter(pi => pi.item.id !== itemId))

    const handleSave = async () => {
        if (!name.trim()) return toast({ title: 'Error', description: 'Pack name is required', variant: 'destructive' })
        if (packItems.length === 0) return toast({ title: 'Error', description: 'Add at least one item', variant: 'destructive' })
        setSaving(true)

        const packPayload = { name, description, total_cost: totalCost, total_selling_price: totalSelling }

        if (editPack) {
            const { error } = await supabase.from('packs').update(packPayload).eq('id', editPack.id)
            if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); setSaving(false); return }
            await supabase.from('pack_items').delete().eq('pack_id', editPack.id)
            await supabase.from('pack_items').insert(packItems.map(pi => ({ pack_id: editPack.id, item_id: pi.item.id, quantity: pi.quantity })))
            toast({ title: 'Pack updated!' })
        } else {
            const { data: newPack, error } = await supabase.from('packs').insert(packPayload).select().single()
            if (error || !newPack) { toast({ title: 'Error', description: error?.message, variant: 'destructive' }); setSaving(false); return }
            await supabase.from('pack_items').insert(packItems.map(pi => ({ pack_id: newPack.id, item_id: pi.item.id, quantity: pi.quantity })))
            toast({ title: 'Pack created!' })
        }

        setOpen(false)
        fetchData()
        setSaving(false)
    }

    const handleDelete = async (id: string) => {
        await supabase.from('packs').delete().eq('id', id)
        toast({ title: 'Pack deleted' })
        setDeleteId(null)
        fetchData()
    }

    const filteredItems = items.filter(i => !packItems.find(pi => pi.item.id === i.id) && i.name.toLowerCase().includes(itemSearch.toLowerCase()))
    const filteredPacks = packs.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))

    return (
        <div className="space-y-5 fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Stethoscope className="w-6 h-6 text-violet-500" /> Pack Builder
                    </h1>
                    <p className="text-slate-500 text-sm">{packs.length} procedure packs</p>
                </div>
                <Button onClick={openAdd} className="bg-blue-600 hover:bg-blue-500"><Plus className="w-4 h-4 mr-2" />Create Pack</Button>
            </div>

            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                    <div className="relative max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input placeholder="Search packs..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Pack Name</TableHead>
                                <TableHead>Items</TableHead>
                                <TableHead>Total Cost</TableHead>
                                <TableHead>Selling Price</TableHead>
                                <TableHead>Margin</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-400">Loading...</TableCell></TableRow>
                            ) : filteredPacks.length === 0 ? (
                                <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-400">No packs found</TableCell></TableRow>
                            ) : filteredPacks.map(pack => (
                                <TableRow key={pack.id}>
                                    <TableCell className="font-medium">{pack.name}</TableCell>
                                    <TableCell className="text-slate-500">{(pack.pack_items as unknown[])?.length || 0} items</TableCell>
                                    <TableCell>{formatCurrency(pack.total_cost)}</TableCell>
                                    <TableCell className="font-semibold">{formatCurrency(pack.total_selling_price)}</TableCell>
                                    <TableCell>
                                        <span className={`font-semibold ${pack.margin_percent >= 20 ? 'text-green-600' : pack.margin_percent >= 10 ? 'text-yellow-600' : 'text-red-500'}`}>
                                            {pack.margin_percent?.toFixed(1)}%
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-slate-500">{formatDate(pack.created_at)}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button variant="ghost" size="icon" title="Duplicate" onClick={() => openDuplicate(pack)}><Copy className="w-4 h-4" /></Button>
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(pack)}><Pencil className="w-4 h-4" /></Button>
                                            <Button variant="ghost" size="icon" className="text-red-500" onClick={() => setDeleteId(pack.id)}><Trash2 className="w-4 h-4" /></Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Pack Builder Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>{editPack ? 'Edit Pack' : 'Create New Pack'}</DialogTitle></DialogHeader>
                    <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Pack Name *</Label>
                                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Standard Surgical Pack" />
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional description" />
                            </div>
                        </div>

                        {/* Item Search */}
                        <div className="space-y-2">
                            <Label>Add Items</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input placeholder="Search items to add..." value={itemSearch} onChange={e => setItemSearch(e.target.value)} className="pl-9" />
                            </div>
                            {itemSearch && filteredItems.length > 0 && (
                                <div className="border rounded-lg max-h-36 overflow-y-auto bg-white shadow-sm z-10">
                                    {filteredItems.map(item => (
                                        <button key={item.id} onClick={() => addItem(item)}
                                            className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 flex justify-between">
                                            <span>{item.name}</span>
                                            <span className="text-slate-400">{formatCurrency(item.selling_price)}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Selected Items */}
                        {packItems.length > 0 && (
                            <div className="space-y-2">
                                <Label>Pack Items ({packItems.length})</Label>
                                <div className="border rounded-lg overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-slate-50">
                                                <TableHead>Item</TableHead>
                                                <TableHead className="w-28">Qty</TableHead>
                                                <TableHead>Unit Price</TableHead>
                                                <TableHead>Line Total</TableHead>
                                                <TableHead className="w-12"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {packItems.map(pi => (
                                                <TableRow key={pi.item.id}>
                                                    <TableCell className="text-sm font-medium">{pi.item.name}</TableCell>
                                                    <TableCell>
                                                        <Input type="number" min="1" value={pi.quantity} className="w-20 h-8"
                                                            onChange={e => updateQty(pi.item.id, Number(e.target.value))} />
                                                    </TableCell>
                                                    <TableCell className="text-sm">{formatCurrency(pi.item.selling_price)}</TableCell>
                                                    <TableCell className="text-sm font-semibold">{formatCurrency(pi.item.selling_price * pi.quantity)}</TableCell>
                                                    <TableCell>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400" onClick={() => removeItem(pi.item.id)}>
                                                            <X className="w-3 h-3" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Totals */}
                                <div className="bg-slate-50 rounded-lg p-4 grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <p className="text-slate-500">Total Cost</p>
                                        <p className="font-bold text-slate-700">{formatCurrency(totalCost)}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500">Selling Price</p>
                                        <p className="font-bold text-blue-600">{formatCurrency(totalSelling)}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500">Margin</p>
                                        <p className={`font-bold ${marginPct >= 20 ? 'text-green-600' : marginPct >= 10 ? 'text-yellow-600' : 'text-red-500'}`}>
                                            {marginPct.toFixed(1)}%
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-500">
                            {saving ? 'Saving…' : editPack ? 'Update Pack' : 'Create Pack'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <DialogContent className="max-w-sm">
                    <DialogHeader><DialogTitle>Delete Pack?</DialogTitle></DialogHeader>
                    <p className="text-sm text-slate-500">This will permanently delete the pack and its item associations.</p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={() => deleteId && handleDelete(deleteId)}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
