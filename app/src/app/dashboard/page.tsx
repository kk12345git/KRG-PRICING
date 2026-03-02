import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, Boxes, Building2, FileText, TrendingUp, IndianRupee } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import DashboardCharts from './DashboardCharts'

export default async function DashboardPage() {
    const supabase = createClient()

    const [
        { count: itemCount },
        { count: packCount },
        { count: hospitalCount },
        { count: quotationCount },
        { data: recentQuotations },
        { data: topItems },
    ] = await Promise.all([
        supabase.from('items').select('*', { count: 'exact', head: true }),
        supabase.from('packs').select('*', { count: 'exact', head: true }),
        supabase.from('hospitals').select('*', { count: 'exact', head: true }),
        supabase.from('quotations').select('*', { count: 'exact', head: true }),
        supabase.from('quotations')
            .select('id, grand_total, status, created_at, hospitals(name)')
            .order('created_at', { ascending: false })
            .limit(5),
        supabase.from('items').select('name, selling_price').eq('status', 'active').order('selling_price', { ascending: false }).limit(5),
    ])

    const stats = [
        { title: 'Total Items', value: itemCount ?? 0, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
        { title: 'Active Packs', value: packCount ?? 0, icon: Boxes, color: 'text-violet-600', bg: 'bg-violet-50' },
        { title: 'Hospitals', value: hospitalCount ?? 0, icon: Building2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { title: 'Quotations', value: quotationCount ?? 0, icon: FileText, color: 'text-orange-600', bg: 'bg-orange-50' },
    ]

    const statusColor: Record<string, string> = {
        draft: 'text-slate-500 bg-slate-100',
        sent: 'text-blue-700 bg-blue-100',
        accepted: 'text-green-700 bg-green-100',
        rejected: 'text-red-700 bg-red-100',
    }

    return (
        <div className="space-y-6 fade-in">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
                <p className="text-slate-500 text-sm mt-1">Welcome to KRG Medifabb Smart Pricing System</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map(({ title, value, icon: Icon, color, bg }) => (
                    <Card key={title} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500 font-medium">{title}</p>
                                    <p className="text-3xl font-bold text-slate-800 mt-1">{value.toLocaleString()}</p>
                                </div>
                                <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center`}>
                                    <Icon className={`w-6 h-6 ${color}`} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Charts */}
            <DashboardCharts topItems={topItems || []} recentQuotations={recentQuotations || []} />

            {/* Recent Quotations */}
            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold text-slate-700 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Recent Quotations
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {recentQuotations && recentQuotations.length > 0 ? (
                        <div className="space-y-2">
                            {recentQuotations.map((q: any) => (
                                <div key={q.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50">
                                    <div>
                                        <p className="text-sm font-medium text-slate-700">{q.hospitals?.name || 'N/A'}</p>
                                        <p className="text-xs text-slate-400">{new Date(q.created_at).toLocaleDateString('en-IN')}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColor[q.status] || ''}`}>
                                            {q.status}
                                        </span>
                                        <p className="text-sm font-bold text-slate-700">{formatCurrency(q.grand_total)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-400 text-center py-6">No quotations yet. Create your first quotation!</p>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
