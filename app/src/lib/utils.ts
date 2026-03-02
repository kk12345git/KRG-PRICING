import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
    }).format(amount)
}

export function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    })
}

export function calculateMargin(purchasePrice: number, sellingPrice: number): number {
    if (sellingPrice === 0) return 0
    return ((sellingPrice - purchasePrice) / sellingPrice) * 100
}

export function calculateGST(price: number, gstPercent: number): number {
    return (price * gstPercent) / 100
}

export function generateSKU(name: string): string {
    const prefix = name.slice(0, 3).toUpperCase()
    const random = Math.random().toString(36).substring(2, 7).toUpperCase()
    return `${prefix}-${random}`
}
