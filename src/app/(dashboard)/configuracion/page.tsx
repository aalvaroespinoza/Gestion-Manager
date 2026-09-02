import {
  getUserProfile,
  getTenantSettings,
  getBranches,
  getTeamUsers,
  getCategoriesWithFields,
} from "@/modules/settings/actions"
import {
  ConfiguracionView,
  UserProfileState,
  CompanySettingsState,
  TeamUserState,
  CategoryWithFields,
} from "./ConfiguracionView"
import { BranchItem } from "@/modules/settings/actions"

export default async function ConfiguracionPage() {
  let userProfile: UserProfileState = {
    id: "usr-default",
    name: "Administrador",
    email: "admin@gestionmanager.com",
    phone: "+56 9 8765 4321",
    position: "Gerente General",
    role: "Administrador",
  }

  let companySettings: CompanySettingsState = {
    companyName: "Distribuidora Industrial S.A.",
    fantasyName: "Gestión Manager Materiales",
    taxId: "76.123.456-7",
    address: "Av. Industrial 4520, Quilicura, Región Metropolitana",
    phone: "+56 2 2987 6543",
    email: "contacto@empresa.cl",
    economicActivity: "Venta al por mayor de materiales de construcción y ferretería",
    currency: "CLP",
    defaultTaxRate: 21,
    mainIndustry: "construccion",
    notifications: {
      emailCriticalStock: true,
      emailDailyReport: true,
      autoPrintReceipt: true,
      assignedPosTerminal: "Terminal Caja #01 - Casa Matriz",
      defaultReceiptType: "TICKET",
    },
  }

  let branches: BranchItem[] = []
  let teamUsers: TeamUserState[] = []
  let categories: CategoryWithFields[] = []

  try {
    const [userRes, tenantRes, branchesRes, usersRes, categoriesRes] = await Promise.all([
      getUserProfile(),
      getTenantSettings(),
      getBranches(),
      getTeamUsers(),
      getCategoriesWithFields(),
    ])

    if (userRes.success && userRes.data) {
      userProfile = userRes.data
    }

    if (tenantRes.success && tenantRes.data) {
      companySettings = tenantRes.data
    }

    if (branchesRes.success && branchesRes.data) {
      branches = branchesRes.data
    }

    if (usersRes.success && usersRes.data) {
      teamUsers = usersRes.data
    }

    if (categoriesRes.success && categoriesRes.data) {
      categories = categoriesRes.data
    }
  } catch (error) {
    console.error("Error al cargar configuración en Server Component:", error)
  }

  return (
    <ConfiguracionView
      initialUserProfile={userProfile}
      initialCompanySettings={companySettings}
      initialBranches={branches}
      initialTeamUsers={teamUsers}
      initialCategories={categories}
    />
  )
}
