export type UserRole = 'admin' | 'sales' | 'accountant'

export interface UserProfile {
    id: string
    email: string
    full_name: string
    role: UserRole
    created_at: string
}

export interface Category {
    id: string
    name: string
    description: string | null
    created_at: string
}

export interface Item {
    id: string
    name: string
    sku: string
    category_id: string
    category?: Category
    purchase_price: number
    selling_price: number
    gst_percent: number
    margin_percent: number
    vendor: string | null
    status: 'active' | 'inactive'
    created_at: string
}

export interface Pack {
    id: string
    name: string
    description: string | null
    total_cost: number
    total_selling_price: number
    margin_percent: number
    created_at: string
    pack_items?: PackItem[]
}

export interface PackItem {
    id: string
    pack_id: string
    item_id: string
    item?: Item
    quantity: number
}

export interface Hospital {
    id: string
    name: string
    address: string | null
    contact_person: string | null
    phone: string | null
    pricing_type: 'standard' | 'custom'
    credit_period: number | null
    created_at: string
}

export interface HospitalPricing {
    id: string
    hospital_id: string
    item_id: string | null
    pack_id: string | null
    custom_price: number
    discount_percent: number
    created_at: string
}

export interface Quotation {
    id: string
    hospital_id: string
    hospital?: Hospital
    created_by: string
    status: 'draft' | 'sent' | 'accepted' | 'rejected'
    subtotal: number
    gst_total: number
    grand_total: number
    notes: string | null
    created_at: string
    quotation_items?: QuotationItem[]
}

export interface QuotationItem {
    id: string
    quotation_id: string
    item_id: string | null
    pack_id: string | null
    item?: Item
    pack?: Pack
    quantity: number
    unit_price: number
    gst_percent: number
    total_price: number
}

export interface DashboardStats {
    totalItems: number
    totalPacks: number
    totalHospitals: number
    totalQuotations: number
    monthlyRevenue: number
    topItems: { name: string; count: number }[]
    recentQuotations: Quotation[]
}
