'use server'

import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import { Prisma, UserRole, UserStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireTenant, requireUser, getCurrentSession } from '@/modules/auth/session-utils'
import { assertRole } from '@/modules/auth/permissions'
import { createSession } from '@/lib/session'
import { ApiResponse } from '@/types'
import { DynamicFormFieldConfig } from '@/components/dynamic-forms/types'

// ==========================================
// Types
// ==========================================

export interface UserProfileUpdateInput {
  name: string
  email: string
  phone?: string
  position?: string
  currentPassword?: string
  newPassword?: string
}

export interface TenantSettingsInput {
  companyName?: string
  businessName?: string
  fantasyName?: string
  taxId?: string
  address?: string
  phone?: string
  email?: string
  economicActivity?: string
  currency?: string
  defaultTaxRate?: number
  mainIndustry?: string
  notifications?: {
    emailCriticalStock?: boolean
    emailDailyReport?: boolean
    autoPrintReceipt?: boolean
    assignedPosTerminal?: string
    defaultReceiptType?: string
  }
}

export interface BranchItem {
  id: string
  name: string
  code: string
  role: string
  address?: string
  phone?: string
  isCurrent?: boolean
}

export interface InviteUserInput {
  name: string
  email: string
  role: 'ADMIN' | 'SELLER' | 'MANAGER'
  password?: string
}

const defaultInitialBranches: BranchItem[] = [
  { id: 'suc-01', name: 'Casa Matriz - Central', code: 'MATRIZ-01', role: 'Principal', isCurrent: true },
  { id: 'suc-02', name: 'Sucursal Norte', code: 'NORTE-01', role: 'Sucursal' },
  { id: 'suc-03', name: 'Sucursal Sur', code: 'SUR-01', role: 'Sucursal' },
]

// ==========================================
// 1. User Profile Actions
// ==========================================

/**
 * Retrieves the current logged in user profile with database data
 */
export async function getUserProfile(): Promise<ApiResponse<any>> {
  try {
    const user = await requireUser()
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { tenant: true },
    })

    if (!dbUser) {
      return { success: false, error: 'Usuario no encontrado' }
    }

    const tenantSettings = (dbUser.tenant.settings as Record<string, any>) || {}
    const userMeta = (tenantSettings.userMetadata?.[dbUser.id] as Record<string, any>) || {}

    return {
      success: true,
      data: {
        id: dbUser.id,
        name: dbUser.name || 'Usuario',
        email: dbUser.email,
        role: dbUser.role,
        status: dbUser.status,
        phone: userMeta.phone || '+56 9 8765 4321',
        position: userMeta.position || (dbUser.role === 'ADMIN' ? 'Gerente de Operaciones' : 'Ejecutivo de Ventas'),
        tenantId: dbUser.tenantId,
        tenantName: dbUser.tenant.name,
      },
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al obtener perfil' }
  }
}

/**
 * Updates the profile of the current logged in user and changes password if requested
 */
export async function updateUserProfile(input: UserProfileUpdateInput): Promise<ApiResponse<any>> {
  try {
    const session = await getCurrentSession()
    if (!session || !session.userId) {
      return { success: false, error: 'No autorizado' }
    }

    const name = input.name?.trim()
    const email = input.email?.trim().toLowerCase()

    if (!name || !email) {
      return { success: false, error: 'Nombre y correo electrónico son requeridos.' }
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { tenant: true },
    })

    if (!dbUser) {
      return { success: false, error: 'Usuario no encontrado' }
    }

    // Check email uniqueness if email modified
    if (email !== dbUser.email) {
      const existingEmail = await prisma.user.findFirst({
        where: {
          email,
          id: { not: session.userId },
        },
      })
      if (existingEmail) {
        return { success: false, error: 'El correo electrónico ya se encuentra registrado por otro usuario.' }
      }
    }

    let passwordHashToUpdate: string | undefined = undefined

    // Handle password change if newPassword is provided
    if (input.newPassword && input.newPassword.trim()) {
      const newPwd = input.newPassword.trim()
      if (newPwd.length < 6) {
        return { success: false, error: 'La nueva contraseña debe tener al menos 6 caracteres.' }
      }

      if (input.currentPassword && dbUser.passwordHash) {
        const isMatch = await bcrypt.compare(input.currentPassword, dbUser.passwordHash)
        if (!isMatch) {
          return { success: false, error: 'La contraseña actual ingresada es incorrecta.' }
        }
      }

      passwordHashToUpdate = await bcrypt.hash(newPwd, 10)
    }

    // Update user in DB
    const updatedUser = await prisma.user.update({
      where: { id: session.userId },
      data: {
        name,
        email,
        ...(passwordHashToUpdate ? { passwordHash: passwordHashToUpdate } : {}),
      },
    })

    // Store phone/position in tenant settings metadata
    const currentSettings = (dbUser.tenant.settings as Record<string, any>) || {}
    const existingUserMeta = currentSettings.userMetadata || {}
    const updatedSettings = {
      ...currentSettings,
      userMetadata: {
        ...existingUserMeta,
        [session.userId]: {
          phone: input.phone || existingUserMeta[session.userId]?.phone || '',
          position: input.position || existingUserMeta[session.userId]?.position || '',
        },
      },
    }

    await prisma.tenant.update({
      where: { id: dbUser.tenantId },
      data: { settings: updatedSettings as unknown as Prisma.InputJsonValue },
    })

    // Re-create cookie session with updated name/email
    await createSession({
      userId: updatedUser.id,
      tenantId: updatedUser.tenantId,
      role: updatedUser.role as any,
      email: updatedUser.email,
      name: updatedUser.name,
    })

    revalidatePath('/configuracion')
    revalidatePath('/dashboard')

    return {
      success: true,
      message: 'Perfil de usuario actualizado exitosamente.',
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: input.phone,
        position: input.position,
      },
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al actualizar perfil' }
  }
}

// ==========================================
// 2. Tenant & Company Settings Actions
// ==========================================

/**
 * Retrieves the complete configuration of the active tenant
 */
export async function getTenantSettings(): Promise<ApiResponse<any>> {
  try {
    const tenantId = await requireTenant()
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    })

    if (!tenant) {
      return { success: false, error: 'Organización no encontrada' }
    }

    const settings = (tenant.settings as Record<string, any>) || {}

    const formatted = {
      id: tenant.id,
      companyName: settings.companyName || tenant.name,
      fantasyName: settings.fantasyName || tenant.name,
      taxId: settings.taxId || '76.123.456-7',
      address: settings.address || 'Av. Industrial 4520, Quilicura, Región Metropolitana',
      phone: settings.phone || '+56 2 2987 6543',
      email: settings.email || 'contacto@empresa.cl',
      economicActivity: settings.economicActivity || 'Venta al por mayor de materiales y suministros',
      currency: settings.currency || 'CLP',
      defaultTaxRate: Number(settings.taxRate ?? settings.defaultTaxRate ?? 21),
      mainIndustry: settings.mainIndustry || 'construccion',
      notifications: settings.notifications || {
        emailCriticalStock: true,
        emailDailyReport: true,
        autoPrintReceipt: true,
        assignedPosTerminal: 'Terminal Caja #01 - Casa Matriz',
        defaultReceiptType: 'TICKET',
      },
    }

    return { success: true, data: formatted }
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al obtener datos de empresa' }
  }
}

/**
 * Updates company and tenant parameters in database
 */
export async function updateTenantSettings(input: TenantSettingsInput): Promise<ApiResponse<any>> {
  try {
    await assertRole(['ADMIN'])
    const tenantId = await requireTenant()
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    })

    if (!tenant) {
      return { success: false, error: 'Organización no encontrada' }
    }

    const currentSettings = (tenant.settings as Record<string, any>) || {}
    const companyName = (input.companyName || input.businessName || tenant.name).trim()

    const updatedSettings: Record<string, any> = {
      ...currentSettings,
      companyName,
      fantasyName: input.fantasyName !== undefined ? input.fantasyName : currentSettings.fantasyName,
      taxId: input.taxId !== undefined ? input.taxId : currentSettings.taxId,
      address: input.address !== undefined ? input.address : currentSettings.address,
      phone: input.phone !== undefined ? input.phone : currentSettings.phone,
      email: input.email !== undefined ? input.email : currentSettings.email,
      economicActivity: input.economicActivity !== undefined ? input.economicActivity : currentSettings.economicActivity,
      currency: input.currency !== undefined ? input.currency : currentSettings.currency,
      taxRate: input.defaultTaxRate !== undefined ? Number(input.defaultTaxRate) : currentSettings.taxRate,
      defaultTaxRate: input.defaultTaxRate !== undefined ? Number(input.defaultTaxRate) : currentSettings.defaultTaxRate,
      mainIndustry: input.mainIndustry !== undefined ? input.mainIndustry : currentSettings.mainIndustry,
    }

    if (input.notifications) {
      updatedSettings.notifications = {
        ...(currentSettings.notifications || {}),
        ...input.notifications,
      }
    }

    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        name: companyName,
        settings: updatedSettings as unknown as Prisma.InputJsonValue,
      },
    })

    revalidatePath('/configuracion')
    revalidatePath('/dashboard')
    revalidatePath('/stock')
    revalidatePath('/ventas')

    return {
      success: true,
      message: 'Configuración de empresa guardada exitosamente.',
      data: updatedSettings,
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al guardar configuración de empresa' }
  }
}

// ==========================================
// 3. Branches CRUD Actions
// ==========================================

/**
 * Retrieves all branches configured for the tenant
 */
export async function getBranches(): Promise<ApiResponse<BranchItem[]>> {
  try {
    const tenantId = await requireTenant()
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    })

    if (!tenant) return { success: false, error: 'Tenant no encontrado' }

    const settings = (tenant.settings as Record<string, any>) || {}
    const branches: BranchItem[] = Array.isArray(settings.branches) && settings.branches.length > 0
      ? settings.branches
      : [
          {
            id: tenant.id,
            name: `${tenant.name} - Casa Matriz`,
            code: `${tenant.slug.toUpperCase().slice(0, 6)}-01`,
            role: 'Principal',
            isCurrent: true,
          },
        ]

    return { success: true, data: branches }
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al obtener sucursales' }
  }
}

/**
 * Creates a new branch for the tenant in database
 */
export async function createBranch(data: {
  name: string
  code: string
  role?: string
  address?: string
  phone?: string
}): Promise<ApiResponse<BranchItem>> {
  try {
    await assertRole(['ADMIN'])
    const tenantId = await requireTenant()
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
    if (!tenant) return { success: false, error: 'Tenant no encontrado' }

    const settings = (tenant.settings as Record<string, any>) || {}
    const branches: BranchItem[] = Array.isArray(settings.branches) ? [...settings.branches] : [...defaultInitialBranches]

    const newBranch: BranchItem = {
      id: `suc-${Date.now()}`,
      name: data.name.trim(),
      code: data.code.trim().toUpperCase(),
      role: data.role?.trim() || 'Sucursal',
      address: data.address?.trim() || '',
      phone: data.phone?.trim() || '',
      isCurrent: false,
    }

    branches.push(newBranch)

    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        settings: {
          ...settings,
          branches,
        } as unknown as Prisma.InputJsonValue,
      },
    })

    revalidatePath('/configuracion')
    revalidatePath('/dashboard')

    return {
      success: true,
      message: `Sucursal "${newBranch.name}" creada exitosamente.`,
      data: newBranch,
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al crear sucursal' }
  }
}

/**
 * Updates an existing branch
 */
export async function updateBranch(
  id: string,
  data: Partial<BranchItem>
): Promise<ApiResponse<BranchItem>> {
  try {
    await assertRole(['ADMIN'])
    const tenantId = await requireTenant()
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
    if (!tenant) return { success: false, error: 'Tenant no encontrado' }

    const settings = (tenant.settings as Record<string, any>) || {}
    let branches: BranchItem[] = Array.isArray(settings.branches) ? [...settings.branches] : [...defaultInitialBranches]

    let updatedBranch: BranchItem | null = null
    branches = branches.map((b) => {
      if (b.id === id) {
        updatedBranch = { ...b, ...data }
        return updatedBranch
      }
      return b
    })

    if (!updatedBranch) {
      return { success: false, error: 'Sucursal no encontrada' }
    }

    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        settings: {
          ...settings,
          branches,
        } as unknown as Prisma.InputJsonValue,
      },
    })

    revalidatePath('/configuracion')
    revalidatePath('/dashboard')

    return {
      success: true,
      message: 'Sucursal actualizada exitosamente.',
      data: updatedBranch,
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al actualizar sucursal' }
  }
}

/**
 * Deletes a branch from tenant settings
 */
export async function deleteBranch(id: string): Promise<ApiResponse<{ id: string }>> {
  try {
    await assertRole(['ADMIN'])
    const tenantId = await requireTenant()
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
    if (!tenant) return { success: false, error: 'Tenant no encontrado' }

    const settings = (tenant.settings as Record<string, any>) || {}
    const branches: BranchItem[] = Array.isArray(settings.branches) ? settings.branches : defaultInitialBranches

    if (branches.length <= 1) {
      return { success: false, error: 'No es posible eliminar la única sucursal principal activa.' }
    }

    const filteredBranches = branches.filter((b) => b.id !== id)

    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        settings: {
          ...settings,
          branches: filteredBranches,
        } as unknown as Prisma.InputJsonValue,
      },
    })

    revalidatePath('/configuracion')
    revalidatePath('/dashboard')

    return {
      success: true,
      message: 'Sucursal eliminada exitosamente.',
      data: { id },
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al eliminar sucursal' }
  }
}

// ==========================================
// 4. Team Members & Collaborators Actions
// ==========================================

/**
 * Retrieves all user members for the active tenant
 */
export async function getTeamUsers(): Promise<ApiResponse<any[]>> {
  try {
    const tenantId = await requireTenant()
    const users = await prisma.user.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
    })

    const formatted = users.map((u) => ({
      id: u.id,
      name: u.name || 'Sin Nombre',
      email: u.email,
      role: u.role,
      status: u.status,
      createdAt: u.createdAt.toISOString(),
      lastLogin: u.createdAt ? new Date(u.createdAt).toLocaleDateString('es-CL') : 'Reciente',
    }))

    return { success: true, data: formatted }
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al listar usuarios' }
  }
}

/**
 * Invites / creates a new user for the active tenant
 */
export async function inviteUser(data: InviteUserInput): Promise<ApiResponse<any>> {
  try {
    await assertRole(['ADMIN'])
    const tenantId = await requireTenant()
    const email = data.email.trim().toLowerCase()
    const name = data.name.trim()

    if (!email || !name) {
      return { success: false, error: 'Nombre y correo electrónico son obligatorios.' }
    }

    const existing = await prisma.user.findFirst({
      where: { email },
    })

    if (existing) {
      return {
        success: false,
        error: `Ya existe una cuenta con el correo "${email}".`,
      }
    }

    const rawPassword = data.password?.trim() || 'Password123!'
    const passwordHash = await bcrypt.hash(rawPassword, 10)

    const newUser = await prisma.user.create({
      data: {
        tenantId,
        name,
        email,
        role: (data.role as UserRole) || 'SELLER',
        status: 'ACTIVE',
        passwordHash,
      },
    })

    revalidatePath('/configuracion')
    revalidatePath('/dashboard')

    return {
      success: true,
      message: `Usuario "${name}" creado exitosamente con credenciales iniciales.`,
      data: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
      },
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al invitar usuario' }
  }
}

/**
 * Deletes a user member from the tenant
 */
export async function deleteUser(userId: string): Promise<ApiResponse<{ id: string }>> {
  try {
    await assertRole(['ADMIN'])
    const tenantId = await requireTenant()
    const currentUser = await requireUser()

    if (currentUser.id === userId) {
      return { success: false, error: 'No puedes eliminar tu propia cuenta de usuario en sesión activa.' }
    }

    const userToDelete = await prisma.user.findFirst({
      where: { id: userId, tenantId },
    })

    if (!userToDelete) {
      return { success: false, error: 'Usuario no encontrado en tu organización.' }
    }

    // Check if it's the last administrator
    if (userToDelete.role === 'ADMIN') {
      const adminCount = await prisma.user.count({
        where: { tenantId, role: 'ADMIN' },
      })
      if (adminCount <= 1) {
        return { success: false, error: 'No es posible eliminar al único Administrador de la organización.' }
      }
    }

    await prisma.user.delete({
      where: { id: userId },
    })

    revalidatePath('/configuracion')
    revalidatePath('/dashboard')

    return {
      success: true,
      message: `Usuario "${userToDelete.name || userToDelete.email}" eliminado exitosamente.`,
      data: { id: userId },
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al eliminar usuario' }
  }
}

// ==========================================
// 5. Dynamic Fields Schema Builder Actions
// ==========================================

/**
 * Retrieves all categories with their dynamic fields configurations
 */
export async function getCategoriesWithFields(): Promise<ApiResponse<any[]>> {
  try {
    const tenantId = await requireTenant()
    const categories = await prisma.category.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    })

    const parsed = categories.map((c) => {
      let fields: DynamicFormFieldConfig[] = []
      if (c.dynamicFieldsConfig) {
        const raw = c.dynamicFieldsConfig as any
        if (Array.isArray(raw)) fields = raw
        else if (Array.isArray(raw.fields)) fields = raw.fields
      }

      return {
        id: c.id,
        name: c.name,
        description: c.description,
        dynamicFieldsConfig: fields,
      }
    })

    return { success: true, data: parsed }
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al obtener categorías y campos' }
  }
}

/**
 * Persists dynamic fields schema in Category table for the given category
 */
export async function saveCustomFields(
  categoryId: string,
  fieldsConfig: DynamicFormFieldConfig[] | { fields: DynamicFormFieldConfig[] }
): Promise<ApiResponse<any>> {
  try {
    await assertRole(['ADMIN', 'MANAGER'])
    const tenantId = await requireTenant()

    const category = await prisma.category.findFirst({
      where: { id: categoryId, tenantId },
    })

    if (!category) {
      return { success: false, error: 'Categoría no encontrada en tu organización.' }
    }

    const payload = Array.isArray(fieldsConfig) ? { fields: fieldsConfig } : fieldsConfig

    const updated = await prisma.category.update({
      where: { id: categoryId },
      data: {
        dynamicFieldsConfig: payload as unknown as Prisma.InputJsonValue,
      },
    })

    revalidatePath('/configuracion')
    revalidatePath('/stock')
    revalidatePath('/ventas')
    revalidatePath('/dashboard')

    return {
      success: true,
      message: `Esquema de campos dinámicos para "${category.name}" guardado exitosamente en base de datos.`,
      data: updated,
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al guardar campos dinámicos' }
  }
}
