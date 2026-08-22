"use client"

import React, { useMemo, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { DynamicFormFieldConfig, DynamicFormSchemaConfig } from "./types"
import { buildZodSchema } from "./schema-builder"
import { CheckCircle2, RotateCcw, Send } from "lucide-react"

export interface DynamicFormRendererProps {
  schema: DynamicFormSchemaConfig
  initialValues?: Record<string, any>
  onSubmit: (data: Record<string, any>) => void | Promise<void>
  onReset?: () => void
  className?: string
  submitButtonText?: string
  showResetButton?: boolean
}

export function DynamicFormRenderer({
  schema,
  initialValues = {},
  onSubmit,
  onReset,
  className,
  submitButtonText,
  showResetButton,
}: DynamicFormRendererProps) {
  const [isSubmittingInternal, setIsSubmittingInternal] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  // 1. Build default values map from schema and initialValues
  const defaultValues = useMemo(() => {
    const defaults: Record<string, any> = {}
    schema.fields.forEach((field) => {
      if (initialValues[field.name] !== undefined) {
        defaults[field.name] = initialValues[field.name]
      } else if (field.defaultValue !== undefined) {
        defaults[field.name] = field.defaultValue
      } else {
        if (field.type === "boolean") defaults[field.name] = false
        else if (field.type === "number") defaults[field.name] = ""
        else defaults[field.name] = ""
      }
    })
    return defaults
  }, [schema.fields, initialValues])

  // 2. Generate dynamic Zod Schema
  const zodSchema = useMemo(() => {
    return buildZodSchema(schema.fields)
  }, [schema.fields])

  // 3. Initialize React Hook Form with Zod resolver
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(zodSchema),
    defaultValues,
    mode: "onBlur",
  })

  // 4. Submission handler
  const handleFormSubmit = async (data: Record<string, any>) => {
    try {
      setIsSubmittingInternal(true)
      setSubmitSuccess(false)
      await onSubmit(data)
      setSubmitSuccess(true)
      setTimeout(() => setSubmitSuccess(false), 4000)
    } finally {
      setIsSubmittingInternal(false)
    }
  }

  const handleFormReset = () => {
    reset(defaultValues)
    setSubmitSuccess(false)
    onReset?.()
  }

  // Grid columns class mapping
  const gridColumnsClass = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  }[schema.columns || 1]

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      noValidate
      className={cn("w-full space-y-6", className)}
    >
      {(schema.title || schema.description) && (
        <div className="space-y-1 pb-2 border-b border-slate-200 dark:border-slate-800">
          {schema.title && (
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {schema.title}
            </h3>
          )}
          {schema.description && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {schema.description}
            </p>
          )}
        </div>
      )}

      {/* Grid of Dynamic Fields */}
      <div className={cn("grid gap-5", gridColumnsClass)}>
        {schema.fields.map((field) => {
          const errorMessage = errors[field.name]?.message as string | undefined

          // Determine column spanning
          const colSpanClass =
            field.colSpan === "full"
              ? "col-span-full"
              : field.colSpan === 2
              ? "sm:col-span-2"
              : field.colSpan === 3
              ? "sm:col-span-2 lg:col-span-3"
              : field.colSpan === 4
              ? "sm:col-span-2 lg:col-span-4"
              : "col-span-1"

          return (
            <div key={field.name} className={cn("w-full", colSpanClass)}>
              {/* Type: Text, Email, Password, Number */}
              {(field.type === "text" ||
                field.type === "email" ||
                field.type === "password" ||
                field.type === "number") && (
                <Input
                  {...register(field.name, {
                    valueAsNumber: field.type === "number",
                  })}
                  type={field.type}
                  label={field.label}
                  placeholder={field.placeholder}
                  helperText={field.description}
                  error={errorMessage}
                  required={field.required}
                  disabled={field.disabled}
                  readOnly={field.readOnly}
                />
              )}

              {/* Type: Select */}
              {field.type === "select" && (
                <Select
                  {...register(field.name)}
                  label={field.label}
                  placeholder={field.placeholder || "Seleccionar..."}
                  options={field.options || []}
                  helperText={field.description}
                  error={errorMessage}
                  required={field.required}
                  disabled={field.disabled}
                />
              )}

              {/* Type: Textarea */}
              {field.type === "textarea" && (
                <div className="flex flex-col gap-1.5 w-full">
                  <label
                    htmlFor={field.name}
                    className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between"
                  >
                    <span>{field.label}</span>
                    {field.required && (
                      <span className="text-red-500 text-xs font-semibold ml-1">*</span>
                    )}
                  </label>
                  <textarea
                    id={field.name}
                    {...register(field.name)}
                    rows={4}
                    placeholder={field.placeholder}
                    disabled={field.disabled}
                    readOnly={field.readOnly}
                    className={cn(
                      "flex w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 disabled:opacity-50",
                      errorMessage && "border-red-500 focus-visible:ring-red-500"
                    )}
                  />
                  {errorMessage ? (
                    <p className="text-xs text-red-500 font-medium">{errorMessage}</p>
                  ) : field.description ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {field.description}
                    </p>
                  ) : null}
                </div>
              )}

              {/* Type: Boolean (Checkbox / Switch UI) */}
              {field.type === "boolean" && (
                <Controller
                  name={field.name}
                  control={control}
                  render={({ field: controllerField }) => (
                    <div className="flex flex-col gap-1 pt-1">
                      <label className="relative flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100/60 dark:hover:bg-slate-800/80 cursor-pointer transition-colors select-none">
                        <input
                          type="checkbox"
                          checked={Boolean(controllerField.value)}
                          onChange={(e) => controllerField.onChange(e.target.checked)}
                          disabled={field.disabled}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 transition-colors"
                        />
                        <div className="flex flex-col text-xs">
                          <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                            {field.label}
                            {field.required && (
                              <span className="text-red-500 text-xs font-semibold">*</span>
                            )}
                          </span>
                          {field.description && (
                            <span className="text-slate-500 dark:text-slate-400 mt-0.5">
                              {field.description}
                            </span>
                          )}
                        </div>
                      </label>
                      {errorMessage && (
                        <p className="text-xs text-red-500 font-medium pl-1">{errorMessage}</p>
                      )}
                    </div>
                  )}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Form Action Buttons & Feedback */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          {submitSuccess && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium animate-in fade-in">
              <CheckCircle2 className="h-4 w-4" />
              <span>Formulario enviado con éxito</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {(schema.showReset || showResetButton) && (
            <Button
              type="button"
              variant="outline"
              onClick={handleFormReset}
              leftIcon={<RotateCcw className="h-4 w-4" />}
              className="w-full sm:w-auto"
            >
              {schema.resetText || "Limpiar"}
            </Button>
          )}

          <Button
            type="submit"
            variant="default"
            isLoading={isSubmitting || isSubmittingInternal}
            leftIcon={<Send className="h-4 w-4" />}
            className="w-full sm:w-auto"
          >
            {submitButtonText || schema.submitText || "Guardar Datos"}
          </Button>
        </div>
      </div>
    </form>
  )
}
