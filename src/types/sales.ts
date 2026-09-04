export type PaymentMethod =
  | "EFECTIVO"
  | "TRANSFERENCIA"
  | "TARJETA_DEBITO"
  | "TARJETA_CREDITO"
  | "CUENTA_CORRIENTE"

export interface CartItem {
  productId: string
  code: string
  name: string
  categoryName?: string
  unitPrice: number
  costPrice: number
  quantity: number
  stock: number
  discountRate?: number
  discountAmount?: number
  taxRate?: number
  taxAmount?: number
  subtotal: number
  customAttributes?: Record<string, any>
}

export interface ClientSelectOption {
  id: string
  name: string
  docType: "DNI" | "CUIT" | "RUT" | "OTRO"
  docNumber: string
  taxCondition: string
  hasCurrentAccount?: boolean
  currentAccountBalance?: number
  email?: string
  phone?: string
  address?: string
}

export interface SaleSummary {
  subtotal: number
  discountType: "PERCENT" | "FIXED"
  discountValue: number
  discountAmount: number
  taxRate: number // e.g. 0.21 or 0.19
  taxAmount: number
  total: number
  totalItems: number
  totalUnits: number
}

export interface InvoiceData {
  id: string
  saleNumber: string
  date: string
  clientId: string
  clientName: string
  clientDoc: string
  clientTaxCondition?: string
  items: CartItem[]
  summary: SaleSummary
  paymentMethod: PaymentMethod
  amountPaid: number
  changeAmount: number
  status: "COMPLETADA" | "PENDIENTE" | "ANULADA"
  cashierName: string
  branchName: string
  notes?: string
}
