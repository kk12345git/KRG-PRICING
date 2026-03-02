'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Category } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { Plus, Pencil, Trash2, Search, Boxes } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function CategoriesPage() {
    const supabase = createClient()
    const { toast } = useToast()
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [open, setOpen] = useState(false)
    const [editItem, setEditItem] = useState<Category | null>(null)
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [saving, setSaving] = useState(false)
    const [deleteId, setDeleteId] = useState<string | null>(null)

    const fetchCategories = async () => {
        const { data } = await supabase.from('categories').select('*').order('name')
        setCategories(data || [])
        setLoading(false)
    }

    useEffect(() => { fetchCategories() }, [])

    const openAdd = () => { setEditItem(null); setName(''); setDescription(''); setOpen(true) }
    const openEdit = (c: Category) => { setEditItem(c); setName(c.name); setDescription(c.description || ''); setOpen(true) }

    const handleSave = async () => {
        if (!name.trim()) return toast({ title: 'Error', description: 'Name is required', variant: 'destructive' })
        setSaving(true)
        if (editItem) {
            const { error } = await supabase.from('categories').update({ name, description }).eq('id', editItem.id)
            if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' })
            else { toast({ title: 'Category updated!', variant: 'default' }); setOpen(false); fetchCategories() }
        } else {
            const { error } = await supabase.from('categories').insert({ name, description })
            if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' })
            else { toast({ title: 'Category added!', variant: 'default' }); setOpen(false); fetchCategories() }
        }
        setSaving(false)
    }

    const handleDelete = async (id: string) => {
        const { error } = await supabase.from('categories').delete().eq('id', id)
        if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' })
        else { toast({ title: 'Category deleted', variant: 'default' }); fetchCategories() }
        setDeleteId(null)
    }

    const filtered = categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))

    return (
        <div className="space-y-5 fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Boxes className="w-6 h-6 text-violet-500" /> Categories
                    </h1>
                    <p className="text-slate-500 text-sm">{categories.length} categories</p>
                </div>
                <Button onClick={openAdd} id="add-category-btn" className="bg-blue-600 hover:bg-blue-500">
                    <Plus className="w-4 h-4 mr-2" /> Add Category
                </Button>
            </div>

            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                    <div className="relative max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input placeholder="Search categories..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={4} className="text-center text-slate-400 py-8">Loading...</TableCell></TableRow>
                            ) : filtered.length === 0 ? (
                                <TableRow><TableCell colSpan={4} className="text-center text-slate-400 py-8">No categories found</TableCell></TableRow>
                            ) : filtered.map(c => (
                                <TableRow key={c.id}>
                                    <TableCell className="font-medium">{c.name}</TableCell>
                                    <TableCell className="text-slate-500">{c.description || '—'}</TableCell>
                                    <TableCell className="text-slate-500">{formatDate(c.created_at)}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="w-4 h-4" /></Button>
                                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700" onClick={() => setDeleteId(c.id)}>
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
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editItem ? 'Edit Category' : 'Add Category'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Name *</Label>
                            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Gloves" />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional description" rows={2} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-500">
                            {saving ? 'Saving…' : editItem ? 'Update' : 'Add'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirm Dialog */}
            <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <DialogContent className="max-w-sm">
                    <DialogHeader><DialogTitle>Delete Category?</DialogTitle></DialogHeader>
                    <p className="text-sm text-slate-500">This action cannot be undone. Items in this category will be unassigned.</p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={() => deleteId && handleDelete(deleteId)}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
