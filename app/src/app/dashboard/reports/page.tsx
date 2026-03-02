'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { BarChart3, TrendingUp, Package, FileText } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444']

export default function ReportsPage() {
    const supabase = createClient()
    const [topItems, setTopItems] = useState<any[]>([])
    const [topPacks, setTopPacks] = useState<any[]>([])
    const [quotationTrend, setQuotationTrend] = useState<any[]>([])
    const [statusDist, setStatusDist] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            const [{ data: items }, { data: packs }, { data: quotations }] = await Promise.all([
                supabase.from('items').select('name, selling_price, margin_percent').eq('status', 'active').order('margin_percent', { ascending: false }).limit(8),
                supabase.from('packs').select('name, total_selling_price, margin_percent').order('margin_percent', { ascending: false }).limit(8),
                supabase.from('quotations').select('status, grand_total, created_at').order('created_at'),
            ])

            setTopItems((items || []).map(i => ({ name: i.name.slice(0, 18), margin: Number(i.margin_percent?.toFixed(1)), price: i.selling_price })))
            setTopPacks((packs || []).map(p => ({ name: p.name.slice(0, 18), margin: Number(p.margin_percent?.toFixed(1)), price: p.total_selling_price })))

            // Group quotations by month
            const byMonth: Record<string, number> = {}
                ; (quotations || []).forEach(q => {
                    const month = new Date(q.created_at).toLocaleString('en-IN', { month: 'short', year: '2-digit' })
                    byMonth[month] = (byMonth[month] || 0) + q.grand_total
                })
            setQuotationTrend(Object.entries(byMonth).map(([month, total]) => ({ month, total })))

            // Status distribution
            const byStatus: Record<string, number> = {}
                ; (quotations || []).forEach(q => { byStatus[q.status] = (byStatus[q.status] || 0) + 1 })
            setStatusDist(Object.entries(byStatus).map(([name, value]) => ({ name, value })))

            setLoading(false)
        }
        load()
    }, [])

    if (loading) return <div className="text-center py-20 text-slate-400">Loading reports...</div>

    return (
        <div className="space-y-6 fade-in">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><BarChart3 className="w-6 h-6 text-indigo-500" />Reports & Analytics</h1>
                <p className="text-slate-500 text-sm">Business insights and performance metrics</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Top Items by Margin */}
                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base text-slate-700 flex items-center gap-2"><Package className="w-4 h-4" />Top Items by Margin %</CardTitle>
                    </CardHeader>
                    <CardContent className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topItems} layout="vertical" margin={{ left: 10, right: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
                                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} />
                                <Tooltip formatter={(v: number) => [`${v}%`, 'Margin']} />
                                <Bar dataKey="margin" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Top Packs by Margin */}
                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base text-slate-700 flex items-center gap-2"><TrendingUp className="w-4 h-4" />Top Packs by Margin %</CardTitle>
                    </CardHeader>
                    <CardContent className="h-64">
                        {topPacks.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-slate-400 text-sm">No packs created yet</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topPacks} layout="vertical" margin={{ left: 10, right: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
                                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} />
                                    <Tooltip formatter={(v: number) => [`${v}%`, 'Margin']} />
                                    <Bar dataKey="margin" fill="#10b981" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Quotation Revenue Trend */}
                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base text-slate-700 flex items-center gap-2"><FileText className="w-4 h-4" />Quotation Revenue Trend</CardTitle>
                    </CardHeader>
                    <CardContent className="h-56">
                        {quotationTrend.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-slate-400 text-sm">No quotations yet</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={quotationTrend} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${v / 1000}k`} />
                                    <Tooltip formatter={(v: number) => [formatCurrency(v), 'Revenue']} />
                                    <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Quotation Status Distribution */}
                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base text-slate-700">Quotation Status Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="h-56">
                        {statusDist.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-slate-400 text-sm">No quotations yet</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={statusDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                        {statusDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
