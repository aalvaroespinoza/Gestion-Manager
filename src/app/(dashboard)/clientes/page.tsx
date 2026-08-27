"use client"

import React, { useState } from "react"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { Modal } from "@/components/ui/modal"
import { DynamicFormRenderer, DynamicFormSchemaConfig } from "@/components/dynamic-forms"
import { Users, Plus, Search } from "lucide-react"

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

const mockClients = [
  { id: 1, name: "Constructora Andina SpA", rut: "76.840.120-4", email: "compras@andina.cl", phone: "+56 9 8831 2291", city: "Santiago", status: "Activo" },
  { id: 2, name: "Agrícola del Valle Ltda", rut: "81.230.990-1", email: "contacto@valle.cl", phone: "+56 9 7712 3450", city: "Rancagua", status: "Activo" },
  { id: 3, name: "Comercial Pacífico S.A.", rut: "96.112.450-K", email: "admin@pacifico.cl", phone: "+56 9 6634 1120", city: "Concepción", status: "Activo" },
  { id: 4, name: "Tecnología Global SpA", rut: "77.540.900-2", email: "finanzas@tecglobal.com", phone: "+56 9 5543 9980", city: "Antofagasta", status: "Bloqueado" },
]

export default function ClientesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const filteredClients = mockClients.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.rut.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <Users className="h-8 w-8 text-orange-500" />
            Directorio de Clientes
          </h1>
          <p className="text-sm text-zinc-400 mt-1 font-medium">
            Gestión de cartera de clientes, datos de facturación y crédito comercial.
          </p>
        </div>

        <Button variant="default" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setIsModalOpen(true)}>
          Nuevo Cliente
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative max-w-sm w-full">
              <Input
                placeholder="Buscar cliente o RUT..."
                leftIcon={<Search className="h-4 w-4" />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table className="border-0 rounded-none">
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold">RUT</TableHead>
                <TableHead className="font-bold">Razón Social</TableHead>
                <TableHead className="font-bold">Contacto</TableHead>
                <TableHead className="font-bold">Ubicación</TableHead>
                <TableHead className="text-center font-bold">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-mono text-xs font-bold text-orange-400">{client.rut}</TableCell>
                  <TableCell className="font-bold text-white text-sm">{client.name}</TableCell>
                  <TableCell>
                    <div className="text-xs text-zinc-300 font-medium">{client.email}</div>
                    <div className="text-[11px] text-zinc-500 font-mono">{client.phone}</div>
                  </TableCell>
                  <TableCell className="text-xs text-zinc-300 font-medium">{client.city}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={client.status === "Activo" ? "success" : "destructive"} size="sm" dot>
                      {client.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Registrar Nuevo Cliente"
        description="Agrega un cliente al directorio para emitir cotizaciones y facturas."
        size="lg"
      >
        <div className="py-2">
          <DynamicFormRenderer
            schema={newCustomerSchema}
            onSubmit={async () => {
              await new Promise((r) => setTimeout(r, 600))
              setIsModalOpen(false)
            }}
          />
        </div>
      </Modal>
    </div>
  )
}
