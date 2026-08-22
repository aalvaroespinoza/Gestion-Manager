"use client"

import React, { useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { DynamicFormRenderer, DynamicFormSchemaConfig } from "@/components/dynamic-forms"
import { Settings, Building, Bell, Shield, Database } from "lucide-react"

const tenantConfigSchema: DynamicFormSchemaConfig = {
  columns: 2,
  submitText: "Guardar Parámetros de Tenant",
  fields: [
    { name: "companyName", label: "Nombre Legal de la Empresa", type: "text", required: true, defaultValue: "Gestión Manager SpA" },
    { name: "rut", label: "RUT Empresa", type: "text", required: true, defaultValue: "77.123.456-0" },
    { name: "economicActivity", label: "Giro Comercial SII", type: "text", required: true, colSpan: "full", defaultValue: "Servicios de informática y comercialización de equipamiento digital" },
    { name: "defaultCurrency", label: "Moneda Principal", type: "select", required: true, defaultValue: "CLP", options: [{ label: "Peso Chileno (CLP)", value: "CLP" }, { label: "Dólar Americano (USD)", value: "USD" }, { label: "Unidad de Fomento (UF)", value: "UF" }] },
    { name: "defaultTaxRate", label: "Tasa IVA (%)", type: "number", required: true, defaultValue: 19 },
    { name: "emailAlerts", label: "Enviar alertas de stock crítico por correo", type: "boolean", defaultValue: true },
    { name: "automaticDTEUpload", label: "Subida automática de DTE al SII al emitir", type: "boolean", defaultValue: true },
  ],
}

export default function ConfiguracionPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Settings className="h-7 w-7 text-blue-600 dark:text-blue-400" />
          Configuración General
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Parámetros multi-tenant, fiscalidad SII, alertas y personalización de sucursales.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Parámetros del Tenant Activo</CardTitle>
              <CardDescription>
                Ajusta la información legal y tributaria de tu empresa para la facturación electrónica.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DynamicFormRenderer
                schema={tenantConfigSchema}
                onSubmit={async (data) => {
                  await new Promise((r) => setTimeout(r, 600))
                }}
              />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-500" />
                Seguridad & Roles
              </CardTitle>
              <CardDescription className="text-xs">
                Acceso restringido por perfiles RBAC (Admin, Cajero, Bodega).
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Database className="h-4 w-4 text-indigo-500" />
                Base de Datos & Backups
              </CardTitle>
              <CardDescription className="text-xs">
                PostgreSQL multi-tenant con aislamiento de esquema por tenant.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  )
}
