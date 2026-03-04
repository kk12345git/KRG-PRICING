'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Quotation, Hospital, Item, Pack } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Plus, Search, FileText, Printer, Download, Trash2, X } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface LineItem { type: 'item' | 'pack'; id: string; name: string; unit_price: number; gst_percent: number; quantity: number }

export default function QuotationsPage() {
    const supabase = createClient()
    const { toast } = useToast()
    const [quotations, setQuotations] = useState<Quotation[]>([])
    const [hospitals, setHospitals] = useState<Hospital[]>([])
    const [items, setItems] = useState<Item[]>([])
    const [packs, setPacks] = useState<Pack[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [open, setOpen] = useState(false)
    const [selectedHospital, setSelectedHospital] = useState('')
    const [notes, setNotes] = useState('')
    const [lineItems, setLineItems] = useState<LineItem[]>([])
    const [productSearch, setProductSearch] = useState('')
    const [saving, setSaving] = useState(false)
    const [deleteId, setDeleteId] = useState<string | null>(null)


    const subtotal = lineItems.reduce((s, li) => s + li.unit_price * li.quantity, 0)
    const gstTotal = lineItems.reduce((s, li) => s + (li.unit_price * li.quantity * li.gst_percent / 100), 0)
    const grandTotal = subtotal + gstTotal

    const fetchData = async () => {
        const [{ data: q }, { data: h }, { data: i }, { data: p }] = await Promise.all([
            supabase.from('quotations').select('*, hospitals(name)').order('created_at', { ascending: false }),
            supabase.from('hospitals').select('*').order('name'),
            supabase.from('items').select('*').eq('status', 'active').order('name'),
            supabase.from('packs').select('*').order('name'),
        ])
        setQuotations(q || [])
        setHospitals(h || [])
        setItems(i || [])
        setPacks(p || [])
        setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchData() }, [])

    const addProduct = (type: 'item' | 'pack', id: string, name: string, price: number, gst: number) => {
        if (lineItems.find(li => li.id === id && li.type === type)) return
        setLineItems([...lineItems, { type, id, name, unit_price: price, gst_percent: gst, quantity: 1 }])
        setProductSearch('')
    }

    const updateLineItem = (idx: number, field: 'quantity' | 'unit_price', val: number) => {
        const updated = [...lineItems]
        updated[idx] = { ...updated[idx], [field]: val }
        setLineItems(updated)
    }

    const removeLineItem = (idx: number) => setLineItems(lineItems.filter((_, i) => i !== idx))

    const handleSave = async () => {
        if (!selectedHospital) return toast({ title: 'Error', description: 'Select a hospital', variant: 'destructive' })
        if (lineItems.length === 0) return toast({ title: 'Error', description: 'Add at least one item', variant: 'destructive' })
        setSaving(true)

        const { data: { user } } = await supabase.auth.getUser()
        const quotationPayload = { hospital_id: selectedHospital, created_by: user?.id, subtotal, gst_total: gstTotal, grand_total: grandTotal, notes: notes || null, status: 'draft' }
        const { data: newQ, error } = await supabase.from('quotations').insert(quotationPayload).select().single()
        if (error || !newQ) { toast({ title: 'Error', description: error?.message, variant: 'destructive' }); setSaving(false); return }

        const qItems = lineItems.map(li => ({
            quotation_id: newQ.id,
            item_id: li.type === 'item' ? li.id : null,
            pack_id: li.type === 'pack' ? li.id : null,
            quantity: li.quantity,
            unit_price: li.unit_price,
            gst_percent: li.gst_percent,
            total_price: li.unit_price * li.quantity * (1 + li.gst_percent / 100),
        }))
        await supabase.from('quotation_items').insert(qItems)

        toast({ title: 'Quotation created!' })
        setOpen(false)
        setLineItems([]); setSelectedHospital(''); setNotes('')
        fetchData()
        setSaving(false)
    }

    const handleDelete = async (id: string) => {
        await supabase.from('quotations').delete().eq('id', id)
        toast({ title: 'Quotation deleted' }); setDeleteId(null); fetchData()
    }

    const updateStatus = async (id: string, status: string) => {
        await supabase.from('quotations').update({ status }).eq('id', id)
        fetchData()
    }

    const exportPDF = async (q: Quotation) => {
        const { default: jsPDF } = await import('jspdf')
        const { default: autoTable } = await import('jspdf-autotable')
        const { data: qItems } = await supabase.from('quotation_items')
            .select('*, items(name), packs(name)')
            .eq('quotation_id', q.id)

        const doc = new jsPDF()
        // Header
        doc.setFillColor(30, 64, 175)
        doc.rect(0, 0, 220, 38, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(18)
        doc.setFont('helvetica', 'bold')
        doc.text('KRG MEDIFABB PVT LTD', 14, 15)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.text('Medical Disposables Manufacturer | Smart Pricing System', 14, 22)
        doc.setFontSize(14)
        doc.text('QUOTATION', 155, 15)
        doc.setFontSize(9)
        doc.text(`#${q.id.slice(0, 8).toUpperCase()}`, 155, 22)
        doc.text(`Date: ${formatDate(q.created_at)}`, 155, 28)

        doc.setTextColor(30, 30, 30)
        doc.setFontSize(10)
        doc.text('To:', 14, 48)
        doc.setFont('helvetica', 'bold')
        doc.text((q.hospital as { name: string })?.name || 'N/A', 24, 48)
        doc.setFont('helvetica', 'normal')

        const tableData = (qItems || []).map((qi: { items?: { name: string }; packs?: { name: string }; quantity: number; unit_price: number; gst_percent: number; total_price: number }) => [
            qi.items?.name || qi.packs?.name || 'N/A',
            qi.quantity,
            `Rs. ${qi.unit_price.toFixed(2)}`,
            `${qi.gst_percent}%`,
            `Rs. ${qi.total_price.toFixed(2)}`,
        ])

        autoTable(doc, {
            startY: 56,
            head: [['Product/Service', 'Qty', 'Unit Price', 'GST%', 'Total']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [30, 64, 175], textColor: 255 },
        })

        const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
        doc.setFontSize(10)
        doc.text(`Subtotal:    Rs. ${q.subtotal.toFixed(2)}`, 130, finalY)
        doc.text(`GST Total:  Rs. ${q.gst_total.toFixed(2)}`, 130, finalY + 7)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(12)
        doc.text(`Grand Total: Rs. ${q.grand_total.toFixed(2)}`, 130, finalY + 16)

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(120)
        doc.text('This is a computer-generated quotation. KRG Medifabb Pvt Ltd', 14, 280)

        doc.save(`Quotation-${q.id.slice(0, 8)}.pdf`)
        toast({ title: 'PDF downloaded!' })
    }

    const statusVariant: Record<string, 'secondary' | 'info' | 'success' | 'destructive' | 'default'> = { draft: 'secondary', sent: 'info', accepted: 'success', rejected: 'destructive' }

    const allProducts = [
        ...items.map(i => ({ type: 'item' as const, id: i.id, name: i.name, price: i.selling_price, gst: i.gst_percent })),
        ...packs.map(p => ({ type: 'pack' as const, id: p.id, name: `📦 ${p.name}`, price: p.total_selling_price, gst: 12 })),
    ].filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()) && !lineItems.find(li => li.id === p.id && li.type === p.type))

    const filtered = quotations.filter(q => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const h = (q as any).hospitals
        const name = (Array.isArray(h) ? h[0]?.name : h?.name) || ''
        return name.toLowerCase().includes(search.toLowerCase())
    })

    return (
        <div className="space-y-5 fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><FileText className="w-6 h-6 text-orange-500" /> Quotations</h1>
                    <p className="text-slate-500 text-sm">{quotations.length} quotations total</p>
                </div>
                <Button onClick={() => { setLineItems([]); setSelectedHospital(''); setNotes(''); setOpen(true) }} className="bg-blue-600 hover:bg-blue-500">
                    <Plus className="w-4 h-4 mr-2" />New Quotation
                </Button>
            </div>

            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                    <div className="relative max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input placeholder="Search by hospital..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Ref#</TableHead>
                                <TableHead>Hospital</TableHead>
                                <TableHead>Subtotal</TableHead>
                                <TableHead>GST</TableHead>
                                <TableHead>Grand Total</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={8} className="text-center py-8 text-slate-400">Loading...</TableCell></TableRow>
                            ) : filtered.length === 0 ? (
                                <TableRow><TableCell colSpan={8} className="text-center py-8 text-slate-400">No quotations found</TableCell></TableRow>
                            ) : filtered.map(q => (
                                <TableRow key={q.id}>
                                    <TableCell className="font-mono text-xs text-slate-500">{q.id.slice(0, 8).toUpperCase()}</TableCell>
                                    <TableCell className="font-medium">
                                        {(() => {
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            const h = (q as any).hospitals
                                            return (Array.isArray(h) ? h[0]?.name : h?.name) || 'N/A'
                                        })()}
                                    </TableCell>
                                    <TableCell>{formatCurrency(q.subtotal)}</TableCell>
                                    <TableCell>{formatCurrency(q.gst_total)}</TableCell>
                                    <TableCell className="font-bold">{formatCurrency(q.grand_total)}</TableCell>
                                    <TableCell>
                                        <Select value={q.status} onValueChange={v => updateStatus(q.id, v)}>
                                            <SelectTrigger className="h-7 w-28 text-xs">
                                                <Badge variant={statusVariant[q.status]}>{q.status}</Badge>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {['draft', 'sent', 'accepted', 'rejected'].map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell className="text-slate-500">{formatDate(q.created_at)}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button variant="ghost" size="icon" title="Download PDF" onClick={() => exportPDF(q)}><Download className="w-4 h-4" /></Button>
                                            <Button variant="ghost" size="icon" title="Print" onClick={() => window.print()}><Printer className="w-4 h-4" /></Button>
                                            <Button variant="ghost" size="icon" className="text-red-500" onClick={() => setDeleteId(q.id)}><Trash2 className="w-4 h-4" /></Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Create Quotation Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>New Quotation</DialogTitle></DialogHeader>
                    <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Hospital *</Label>
                                <Select value={selectedHospital} onValueChange={setSelectedHospital}>
                                    <SelectTrigger><SelectValue placeholder="Select hospital" /></SelectTrigger>
                                    <SelectContent>{hospitals.map(h => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Notes</Label>
                                <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Add Items / Packs</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input placeholder="Search items or packs to add..." value={productSearch} onChange={e => setProductSearch(e.target.value)} className="pl-9" />
                            </div>
                            {productSearch && allProducts.length > 0 && (
                                <div className="border rounded-lg max-h-44 overflow-y-auto bg-white shadow-sm">
                                    {allProducts.map(p => (
                                        <button key={`${p.type}-${p.id}`} onClick={() => addProduct(p.type, p.id, p.name, p.price, p.gst)}
                                            className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 flex justify-between">
                                            <span>{p.name}</span>
                                            <span className="text-slate-400">{formatCurrency(p.price)}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {lineItems.length > 0 && (
                            <div className="space-y-3">
                                <div className="border rounded-lg overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-slate-50">
                                                <TableHead>Product</TableHead>
                                                <TableHead className="w-24">Qty</TableHead>
                                                <TableHead className="w-32">Unit Price</TableHead>
                                                <TableHead className="w-20">GST%</TableHead>
                                                <TableHead className="w-32">Total</TableHead>
                                                <TableHead className="w-10"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {lineItems.map((li, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell className="text-sm font-medium">{li.name}</TableCell>
                                                    <TableCell><Input type="number" min="1" value={li.quantity} onChange={e => updateLineItem(idx, 'quantity', Number(e.target.value))} className="h-8 w-20" /></TableCell>
                                                    <TableCell><Input type="number" min="0" step="0.01" value={li.unit_price} onChange={e => updateLineItem(idx, 'unit_price', Number(e.target.value))} className="h-8 w-28" /></TableCell>
                                                    <TableCell className="text-sm">{li.gst_percent}%</TableCell>
                                                    <TableCell className="text-sm font-semibold">{formatCurrency(li.unit_price * li.quantity)}</TableCell>
                                                    <TableCell><Button variant="ghost" size="icon" className="h-7 w-7 text-red-400" onClick={() => removeLineItem(idx)}><X className="w-3 h-3" /></Button></TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                <div className="bg-blue-50 rounded-lg p-4 space-y-1.5 text-sm">
                                    <div className="flex justify-between"><span className="text-slate-600">Subtotal</span><span className="font-medium">{formatCurrency(subtotal)}</span></div>
                                    <div className="flex justify-between"><span className="text-slate-600">GST Total</span><span className="font-medium">{formatCurrency(gstTotal)}</span></div>
                                    <div className="flex justify-between border-t border-blue-200 pt-1.5 mt-1.5">
                                        <span className="font-bold text-slate-800">Grand Total</span>
                                        <span className="font-bold text-blue-700 text-base">{formatCurrency(grandTotal)}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-500">{saving ? 'Creating…' : 'Create Quotation'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <DialogContent className="max-w-sm">
                    <DialogHeader><DialogTitle>Delete Quotation?</DialogTitle></DialogHeader>
                    <p className="text-sm text-slate-500">This will permanently delete the quotation and all its line items.</p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={() => deleteId && handleDelete(deleteId)}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
