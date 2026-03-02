'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Stethoscope, Loader2, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
    const router = useRouter()
    const supabase = createClient()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPwd, setShowPwd] = useState(false)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
            setError(error.message)
            setLoading(false)
        } else {
            router.push('/dashboard')
            router.refresh()
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
            {/* Background pattern */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Brand */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 shadow-2xl shadow-blue-600/50 mb-4">
                        <Stethoscope className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">KRG Medifabb</h1>
                    <p className="text-slate-400 mt-1">Smart Pricing & Pack Builder</p>
                </div>

                <Card className="shadow-2xl border-slate-700/50 bg-slate-800/80 backdrop-blur text-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xl text-white">Sign In</CardTitle>
                        <CardDescription className="text-slate-400">
                            Enter your credentials to access the system
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-slate-200">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@krgmedifabb.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                    className="bg-slate-700/60 border-slate-600 text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-slate-200">Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPwd ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        required
                                        className="bg-slate-700/60 border-slate-600 text-white placeholder:text-slate-500 focus-visible:ring-blue-500 pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPwd(!showPwd)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                                    >
                                        {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-500/20 border border-red-500/40 text-red-300 text-sm px-3 py-2 rounded-lg">
                                    {error}
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30"
                                disabled={loading}
                            >
                                {loading ? (
                                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing in...</>
                                ) : 'Sign In'}
                            </Button>
                        </form>

                        <p className="text-center text-xs text-slate-500 mt-6">
                            © 2025 KRG Medifabb Pvt Ltd. Internal use only.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
