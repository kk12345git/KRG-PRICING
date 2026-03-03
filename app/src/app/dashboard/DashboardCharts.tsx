'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

interface Props {
    topItems: { name: string; selling_price: number }[]
    recentQuotations: { grand_total: number; created_at: string }[]
}

export default function DashboardCharts({ topItems, recentQuotations }: Props) {
    const itemChartData = topItems.map(i => ({
        name: i.name.length > 15 ? i.name.slice(0, 15) + '…' : i.name,
        price: i.selling_price,
    }))

    const quotationChartData = recentQuotations.slice().reverse().map((q, i) => ({
        name: `Q${i + 1}`,
        total: q.grand_total,
    }))

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold text-slate-700">Top Items by Price</CardTitle>
                </CardHeader>
                <CardContent className="h-52">
                    {itemChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={itemChartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${v}`} />
                                <Tooltip formatter={(v: number | string | Array<number | string> | undefined) => [formatCurrency(Number(v || 0)), 'Price']} />
                                <Bar dataKey="price" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-400 text-sm">No items yet</div>
                    )}
                </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold text-slate-700">Recent Quotation Values</CardTitle>
                </CardHeader>
                <CardContent className="h-52">
                    {quotationChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={quotationChartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${v / 1000}k`} />
                                <Tooltip formatter={(v: number | string | Array<number | string> | undefined) => [formatCurrency(Number(v || 0)), 'Grand Total']} />
                                <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-400 text-sm">No quotations yet</div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
