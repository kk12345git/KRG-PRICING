import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('full_name, role')
        .eq('id', user.id)
        .single()

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            <Sidebar
                userRole={profile?.role || 'sales'}
                userName={profile?.full_name || user.email || 'User'}
            />
            <main className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto">
                    <div className="p-6 max-w-screen-2xl mx-auto">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    )
}
