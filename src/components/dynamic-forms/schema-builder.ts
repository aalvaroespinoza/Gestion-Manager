import { z } from "zod"
import { DynamicFormFieldConfig } from "./types"

export function buildZodSchema(fields: DynamicFormFieldConfig[]) {
  const schemaShape: Record<string, z.ZodTypeAny> = {}

  for (const field of fields) {
    const { name, label, type, required = false, requiredMessage, min, max, minLength, maxLength, pattern } = field
    const reqMsg = requiredMessage || `${label || name} es requerido`

    switch (type) {
      case "text":
      case "password":
      case "textarea": {
        let fieldSchema = z.string()

        if (required) {
          fieldSchema = fieldSchema.min(minLength || 1, minLength ? `${label} debe tener al menos ${minLength} caracteres` : reqMsg)
        } else {
          fieldSchema = fieldSchema.optional().or(z.literal("")) as unknown as typeof fieldSchema
        }

        if (maxLength) {
          fieldSchema = fieldSchema.max(maxLength, `${label} no puede superar ${maxLength} caracteres`)
        }

        if (pattern) {
          fieldSchema = fieldSchema.regex(new RegExp(pattern.regex), pattern.message || `Formato inválido para ${label}`)
        }

        schemaShape[name] = fieldSchema
        break
      }

      case "email": {
        let fieldSchema = z.string()

        if (required) {
          fieldSchema = fieldSchema
            .min(1, reqMsg)
            .email("Ingrese un correo electrónico válido")
        } else {
          fieldSchema = fieldSchema
            .email("Ingrese un correo electrónico válido")
            .optional()
            .or(z.literal("")) as unknown as typeof fieldSchema
        }

        schemaShape[name] = fieldSchema
        break
      }

      case "number": {
        let numSchema = z.coerce.number({
          invalid_type_error: `${label || name} debe ser un número`,
        })

        if (min !== undefined) {
          numSchema = numSchema.min(min, `${label || name} debe ser mayor o igual a ${min}`)
        }

        if (max !== undefined) {
          numSchema = numSchema.max(max, `${label || name} no puede ser mayor a ${max}`)
        }

        if (!required) {
          schemaShape[name] = z.preprocess(
            (val) => (val === "" || val === undefined || val === null ? undefined : val),
            numSchema.optional()
          )
        } else {
          schemaShape[name] = numSchema
        }
        break
      }

      case "select": {
        let selectSchema = z.union([z.string(), z.number()])

        if (required) {
          schemaShape[name] = selectSchema.refine(
            (val) => val !== "" && val !== undefined && val !== null,
            { message: reqMsg }
          )
        } else {
          schemaShape[name] = selectSchema.optional()
        }
        break
      }

      case "boolean": {
        let boolSchema = z.boolean().default(false)

        if (required) {
          schemaShape[name] = boolSchema.refine((val) => val === true, {
            message: reqMsg || `Debe marcar ${label}`,
          })
        } else {
          schemaShape[name] = boolSchema
        }
        break
      }

      default: {
        schemaShape[name] = z.any().optional()
        break
      }
    }
  }

  return z.object(schemaShape)
}
