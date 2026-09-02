import { getClients } from "@/modules/clients/actions"
import { ClientesView, ClientItem } from "./ClientesView"

export default async function ClientesPage() {
  let clients: ClientItem[] = []

  try {
    const res = await getClients({ page: 1, pageSize: 100 })
    if (res.success && res.data && res.data.clients) {
      clients = res.data.clients.map((c: any) => ({
        id: c.id,
        name: c.name,
        docType: c.docType,
        docNumber: c.docNumber,
        email: c.email,
        phone: c.phone,
        address: c.address,
        creditLimit: Number(c.creditLimit || 0),
        currentAccountBalance: Number(c.currentAccountBalance || 0),
        metadata: c.metadata,
        createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : undefined,
      }))
    }
  } catch (error) {
    console.error("Error al cargar clientes en ClientesPage:", error)
  }

  return <ClientesView initialClients={clients} />
}
