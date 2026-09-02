"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { Modal } from "@/components/ui/modal"
import { DynamicFormRenderer, DynamicFormSchemaConfig } from "@/components/dynamic-forms"
import { ToastContainer, ToastMessage } from "@/components/ui/toast"
import { createClient, deleteClient } from "@/modules/clients/actions"
import { Users, Plus, Search, Trash2, AlertTriangle, RotateCcw } from "lucide-react"

const newCustomerSchema: DynamicFormSchemaConfig = {
  columns: 2,
  submitText: "Registrar Cliente",
  fields: [
    { name: "businessName", label: "Razón Social o Nombre", type: "text", required: true, colSpan: "full", placeholder: "Ej. Empresa de Transportes SpA" },
    { name: "rut", label: "RUT / Identificación Tributaria", type: "text", required: true, placeholder: "76.123.456-7" },
    { name: "email", label: "Correo Electrónico de Contacto", type: "email", required: true, placeholder: "contacto@empresa.cl" },
    { name: "phone", label: "Teléfono", type: "text", placeholder: "+56 9 1234 5678" },
    { name: "city", label: "Ciudad / Comuna", type: "text", placeholder: "Santiago" },
    { name: "address", label: "Dirección Comercial", type: "text", colSpan: "full", placeholder: "Av. Providencia 1234, Of 501" },
    { name: "isCreditAllowed", label: "Habilitar línea de crédito para este cliente", type: "boolean", defaultValue: false },
  ],
}

export interface ClientItem {
  id: string
  name: string
  docType?: string | null
  docNumber?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  creditLimit?: number
  currentAccountBalance?: number
  metadata?: any
  createdAt?: string
}

interface ClientesViewProps {
  initialClients: ClientItem[]
}

export function ClientesView({ initialClients }: ClientesViewProps) {
  const router = useRouter()
  const [clients, setClients] = useState<ClientItem[]>(initialClients)
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingClient, setDeletingClient] = useState<ClientItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = useCallback(
    (title: string, description?: string, type: ToastMessage["type"] = "success") => {
      const newToast: ToastMessage = {
        id: `toast-${Date.now()}-${Math.random()}`,
        title,
        description,
        type,
      }
      setToasts((prev) => [...prev, newToast])
    },
    []
  )

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // Sync state when props update
  useEffect(() => {
    setClients(initialClients)
  }, [initialClients])

  const filteredClients = useMemo(() => {
    if (!searchTerm.trim()) return clients
    const q = searchTerm.toLowerCase()
    return clients.filter((c) => {
      const matchName = c.name?.toLowerCase().includes(q)
      const matchDoc = c.docNumber?.toLowerCase().includes(q)
      const matchEmail = c.email?.toLowerCase().includes(q)
      const matchPhone = c.phone?.toLowerCase().includes(q)
      const matchAddress = c.address?.toLowerCase().includes(q)
      const matchCity = (c.metadata?.city || "")?.toLowerCase().includes(q)
      return matchName || matchDoc || matchEmail || matchPhone || matchAddress || matchCity
    })
  }, [clients, searchTerm])

  const handleCreateClient = async (formData: Record<string, any>) => {
    try {
      setIsSubmitting(true)
      const res = await createClient(formData)
      if (!res.success) {
        addToast("Error al Registrar Cliente", res.error || "No se pudo crear el cliente.", "destructive")
        return
      }

      const created = res.data
      const newClientItem: ClientItem = {
        id: created.id,
        name: created.name,
        docType: created.docType,
        docNumber: created.docNumber,
        email: created.email,
        phone: created.phone,
        address: created.address,
        creditLimit: Number(created.creditLimit || 0),
        metadata: created.metadata,
        createdAt: created.createdAt ? new Date(created.createdAt).toISOString() : new Date().toISOString(),
      }

      setClients((prev) => [newClientItem, ...prev])
      setIsModalOpen(false)
      addToast("Cliente Creado con Éxito", `Se registró "${created.name}" en la base de datos.`, "success")
      router.refresh()
    } catch (err: any) {
      addToast("Error", err.message || "Error al conectar con el servidor.", "destructive")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteClient = async () => {
    if (!deletingClient) return
    try {
      setIsDeleting(true)
      const res = await deleteClient(deletingClient.id)
      if (!res.success) {
        addToast("Error al Eliminar", res.error || "No se pudo eliminar el cliente.", "destructive")
        return
      }

      setClients((prev) => prev.filter((c) => c.id !== deletingClient.id))
      addToast("Cliente Eliminado", `"${deletingClient.name}" fue removido de la base de datos.`, "destructive")
      setDeletingClient(null)
      router.refresh()
    } catch (err: any) {
      addToast("Error al Eliminar", err.message || "Error inesperado.", "destructive")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <Users className="h-8 w-8 text-primary" />
            Directorio de Clientes
          </h1>
          <p className="text-sm text-zinc-400 mt-1 font-medium">
            Gestión de cartera de clientes, datos de facturación y crédito comercial persistidos en base de datos.
          </p>
        </div>

        <Button
          variant="default"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setIsModalOpen(true)}
          className="cursor-pointer font-bold"
        >
          Nuevo Cliente
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative max-w-sm w-full">
              <Input
                placeholder="Buscar cliente, RUT o email..."
                leftIcon={<Search className="h-4 w-4" />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {searchTerm && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchTerm("")}
                leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
                className="cursor-pointer text-xs"
              >
                Limpiar Búsqueda
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table className="border-0 rounded-none">
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold">Identificación / RUT</TableHead>
                <TableHead className="font-bold">Razón Social o Nombre</TableHead>
                <TableHead className="font-bold">Contacto</TableHead>
                <TableHead className="font-bold">Ubicación / Dirección</TableHead>
                <TableHead className="text-center font-bold">Línea de Crédito</TableHead>
                <TableHead className="text-right font-bold">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-zinc-400">
                    <div className="max-w-xs mx-auto space-y-2">
                      <Users className="h-8 w-8 mx-auto text-zinc-600" />
                      <p className="font-bold text-white text-sm">No se encontraron clientes</p>
                      <p className="text-xs">
                        {searchTerm
                          ? "No hay resultados para el término de búsqueda ingresado."
                          : "Aún no has registrado clientes. Haz clic en 'Nuevo Cliente' para comenzar."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => {
                  const hasCredit = Number(client.creditLimit || 0) > 0 || client.metadata?.isCreditAllowed
                  const city = client.metadata?.city || ""

                  return (
                    <TableRow key={client.id} className="hover:bg-zinc-800/60 transition-colors">
                      <TableCell className="font-mono text-xs font-medium text-primary">
                        {client.docNumber || "S/D"}
                        {client.docType ? ` (${client.docType})` : ""}
                      </TableCell>

                      <TableCell className="font-bold text-white text-sm">
                        {client.name}
                      </TableCell>

                      <TableCell>
                        <div className="text-xs text-zinc-300 font-medium">
                          {client.email || <span className="text-zinc-500 italic">Sin correo</span>}
                        </div>
                        {client.phone && (
                          <div className="text-[11px] text-zinc-500 font-mono">{client.phone}</div>
                        )}
                      </TableCell>

                      <TableCell className="text-xs text-zinc-300 font-medium max-w-[200px] truncate">
                        {client.address || city || <span className="text-zinc-500 italic">Sin dirección</span>}
                      </TableCell>

                      <TableCell className="text-center">
                        {hasCredit ? (
                          <Badge variant="success" size="sm" dot>
                            Crédito Habilitado
                          </Badge>
                        ) : (
                          <Badge variant="secondary" size="sm">
                            Sin Crédito
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <button
                          type="button"
                          title="Eliminar Cliente"
                          onClick={() => setDeletingClient(client)}
                          className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal Registrar Cliente */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Registrar Nuevo Cliente"
        description="Agrega un cliente al directorio para emitir cotizaciones, tickets y facturas en la base de datos."
        size="lg"
      >
        <div className="py-2">
          <DynamicFormRenderer
            schema={newCustomerSchema}
            onSubmit={handleCreateClient}
          />
        </div>
      </Modal>

      {/* Modal Confirmar Eliminación */}
      <Modal
        isOpen={Boolean(deletingClient)}
        onClose={() => setDeletingClient(null)}
        size="sm"
        title={
          <div className="flex items-center gap-2.5 text-red-400 font-bold">
            <div className="p-2 rounded-xl bg-red-500/15 text-red-400 border border-red-500/30">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <span>Confirmar Eliminación</span>
          </div>
        }
        description="Esta acción removerá el cliente permanentemente de la base de datos."
      >
        {deletingClient && (
          <div className="space-y-4 pt-1">
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-zinc-300 space-y-2">
              <p className="text-zinc-400">
                ¿Estás seguro de que deseas eliminar al siguiente cliente?
              </p>
              <div className="font-bold text-white text-sm">
                {deletingClient.name}
              </div>
              <div className="text-zinc-400 font-mono text-[11px]">
                <span>Documento: <strong className="text-white">{deletingClient.docNumber || "S/D"}</strong></span>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-3 border-t border-zinc-800">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setDeletingClient(null)}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                isLoading={isDeleting}
                leftIcon={<Trash2 className="h-4 w-4" />}
                onClick={handleDeleteClient}
              >
                Eliminar Cliente
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
