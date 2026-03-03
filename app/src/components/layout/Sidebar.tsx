'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
    LayoutDashboard, Package, Boxes, Building2, FileText,
    BarChart3, Settings, LogOut, ChevronLeft, Stethoscope
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/items', label: 'Items', icon: Package },
    { href: '/dashboard/categories', label: 'Categories', icon: Boxes },
    { href: '/dashboard/packs', label: 'Pack Builder', icon: Stethoscope },
    { href: '/dashboard/hospitals', label: 'Hospitals', icon: Building2 },
    { href: '/dashboard/quotations', label: 'Quotations', icon: FileText },
    { href: '/dashboard/reports', label: 'Reports', icon: BarChart3 },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

interface SidebarProps {
    userRole?: string
    userName?: string
}

export default function Sidebar({ userRole = 'sales', userName = 'User' }: SidebarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()
    const [collapsed, setCollapsed] = useState(false)

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    const visibleItems = navItems.filter(item => {
        if (item.href === '/dashboard/settings') return userRole === 'admin'
        return true
    })

    return (
        <aside className={cn(
            'flex flex-col h-screen bg-slate-900 text-white transition-all duration-300 border-r border-slate-800',
            collapsed ? 'w-16' : 'w-64'
        )}>
            {/* Logo */}
            <div className={cn('flex items-center gap-3 px-4 py-5 border-b border-slate-800', collapsed && 'justify-center px-2')}>
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-500 shrink-0">
                    <span className="text-white font-bold text-sm">KRG</span>
                </div>
                {!collapsed && (
                    <div>
                        <p className="text-sm font-bold text-white leading-tight">KRG Medifabb</p>
                        <p className="text-xs text-slate-400 leading-tight">Smart Pricing</p>
                    </div>
                )}
            </div>

            {/* Nav */}
            <nav className="flex-1 py-4 overflow-y-auto">
                <ul className="space-y-1 px-2">
                    {visibleItems.map(item => {
                        const Icon = item.icon
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={cn(
                                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group',
                                        isActive
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                            : 'text-slate-400 hover:bg-slate-800 hover:text-white',
                                        collapsed && 'justify-center px-2'
                                    )}
                                    title={collapsed ? item.label : undefined}
                                >
                                    <Icon className="w-5 h-5 shrink-0" />
                                    {!collapsed && <span className="font-medium">{item.label}</span>}
                                </Link>
                            </li>
                        )
                    })}
                </ul>
            </nav>

            {/* User + Logout */}
            <div className={cn('p-3 border-t border-slate-800 space-y-2', collapsed && 'px-2')}>
                {!collapsed && (
                    <div className="flex items-center gap-2 px-2 py-1.5">
                        <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                            {userName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-white truncate">{userName}</p>
                            <p className="text-xs text-slate-400 capitalize">{userRole}</p>
                        </div>
                    </div>
                )}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className={cn('w-full text-slate-400 hover:text-white hover:bg-red-600/20', collapsed && 'px-2')}
                    title="Logout"
                >
                    <LogOut className="w-4 h-4 shrink-0" />
                    {!collapsed && <span className="ml-2">Logout</span>}
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCollapsed(!collapsed)}
                    className={cn('w-full text-slate-500 hover:text-white hover:bg-slate-800', collapsed && 'px-2')}
                >
                    <ChevronLeft className={cn('w-4 h-4 transition-transform duration-200', collapsed && 'rotate-180')} />
                    {!collapsed && <span className="ml-2 text-xs">Collapse</span>}
                </Button>
            </div>
        </aside>
    )
}
