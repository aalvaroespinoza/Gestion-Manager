import { PrismaClient, Prisma } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando Seed Multi-Rubro Multi-Tenant...')

  const defaultPasswordHash = await bcrypt.hash('admin123', 10)

  // =========================================================================
  // 1. TENANT A: Rubro Construcción / Corralón
  // =========================================================================
  console.log('🏗️ Creando Tenant A (Construcción / Corralón)...')

  const tenantA = await prisma.tenant.upsert({
    where: { slug: 'corralon-del-valle' },
    update: {
      name: 'Corralón del Valle S.A.',
      plan: 'PRO',
      status: 'ACTIVE',
      settings: {
        currency: 'ARS',
        currencySymbol: '$',
        timezone: 'America/Argentina/Buenos_Aires',
        invoicePrefix: 'COR-',
        taxRate: 21,
        taxName: 'IVA',
        companyLegalName: 'Corralón del Valle Sociedad Anónima',
        companyTaxId: '30-65498712-3',
        address: 'Ruta Provincial 5 Km 12, Córdoba',
        phone: '+54 351 456-7890',
        email: 'contacto@corralondelvalle.com',
      } as Prisma.InputJsonValue,
    },
    create: {
      name: 'Corralón del Valle S.A.',
      slug: 'corralon-del-valle',
      plan: 'PRO',
      status: 'ACTIVE',
      settings: {
        currency: 'ARS',
        currencySymbol: '$',
        timezone: 'America/Argentina/Buenos_Aires',
        invoicePrefix: 'COR-',
        taxRate: 21,
        taxName: 'IVA',
        companyLegalName: 'Corralón del Valle Sociedad Anónima',
        companyTaxId: '30-65498712-3',
        address: 'Ruta Provincial 5 Km 12, Córdoba',
        phone: '+54 351 456-7890',
        email: 'contacto@corralondelvalle.com',
      } as Prisma.InputJsonValue,
    },
  })

  // Usuario Admin Tenant A
  const userA = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenantA.id,
        email: 'admin@corralon.com',
      },
    },
    update: {
      name: 'Admin Corralón',
      passwordHash: defaultPasswordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
    create: {
      tenantId: tenantA.id,
      email: 'admin@corralon.com',
      passwordHash: defaultPasswordHash,
      name: 'Admin Corralón',
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  })

  // Categoría "Placas y Perfilería" con Dynamic Fields
  const categoryA = await prisma.category.upsert({
    where: {
      tenantId_name: {
        tenantId: tenantA.id,
        name: 'Placas y Perfilería',
      },
    },
    update: {
      description: 'Placas de yeso, cementicias y estructura de perfilería galvanizada',
      dynamicFieldsConfig: {
        fields: [
          {
            name: 'espesor_mm',
            type: 'number',
            label: 'Espesor (mm)',
            required: true,
            unit: 'mm',
            description: 'Espesor nominal del material',
          },
          {
            name: 'largo_mts',
            type: 'number',
            label: 'Largo (m)',
            required: true,
            unit: 'm',
            description: 'Largo de la placa o perfil',
          },
        ],
      } as Prisma.InputJsonValue,
    },
    create: {
      tenantId: tenantA.id,
      name: 'Placas y Perfilería',
      description: 'Placas de yeso, cementicias y estructura de perfilería galvanizada',
      dynamicFieldsConfig: {
        fields: [
          {
            name: 'espesor_mm',
            type: 'number',
            label: 'Espesor (mm)',
            required: true,
            unit: 'mm',
            description: 'Espesor nominal del material',
          },
          {
            name: 'largo_mts',
            type: 'number',
            label: 'Largo (m)',
            required: true,
            unit: 'm',
            description: 'Largo de la placa o perfil',
          },
        ],
      } as Prisma.InputJsonValue,
    },
  })

  // 3 Productos de prueba Tenant A
  const productsA = [
    {
      code: 'PY-125',
      name: 'Placa de Yeso Estándar 12.5mm',
      description: 'Placa de yeso para interiores estándar 1.20 x 2.40m',
      costPrice: new Prisma.Decimal(4500),
      salePrice: new Prisma.Decimal(7200),
      currentStock: new Prisma.Decimal(150),
      minStock: new Prisma.Decimal(20),
      customAttributes: { espesor_mm: 12.5, largo_mts: 2.4 },
    },
    {
      code: 'PM-69',
      name: 'Perfil Montante 69mm',
      description: 'Perfil de chapa galvanizada para tabiques',
      costPrice: new Prisma.Decimal(1800),
      salePrice: new Prisma.Decimal(3100),
      currentStock: new Prisma.Decimal(8), // ⚠️ Stock Crítico (8 <= 25)
      minStock: new Prisma.Decimal(25),
      customAttributes: { espesor_mm: 0.5, largo_mts: 2.6 },
    },
    {
      code: 'PV-125',
      name: 'Placa Antihumedad Verde 12.5mm',
      description: 'Placa con tratamiento hidrófugo para baños y cocinas',
      costPrice: new Prisma.Decimal(6200),
      salePrice: new Prisma.Decimal(9800),
      currentStock: new Prisma.Decimal(45),
      minStock: new Prisma.Decimal(15),
      customAttributes: { espesor_mm: 12.5, largo_mts: 2.4 },
    },
  ]

  for (const prod of productsA) {
    const existing = await prisma.product.findFirst({
      where: { tenantId: tenantA.id, code: prod.code },
    })

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          ...prod,
          categoryId: categoryA.id,
          customAttributes: prod.customAttributes as unknown as Prisma.InputJsonValue,
        },
      })
    } else {
      await prisma.product.create({
        data: {
          ...prod,
          tenantId: tenantA.id,
          categoryId: categoryA.id,
          customAttributes: prod.customAttributes as unknown as Prisma.InputJsonValue,
        },
      })
    }
  }

  // Cliente de prueba Tenant A
  const clientA = await prisma.client.upsert({
    where: {
      id: 'client-corralon-demo-1',
    },
    update: {
      name: 'Construcciones Norte SRL',
      docType: 'CUIT',
      docNumber: '30-71234567-8',
      email: 'compras@construccionesnorte.com',
      phone: '+54 11 4567-8901',
      address: 'Av. Industrial 4500, Buenos Aires',
      creditLimit: new Prisma.Decimal(500000),
    },
    create: {
      id: 'client-corralon-demo-1',
      tenantId: tenantA.id,
      name: 'Construcciones Norte SRL',
      docType: 'CUIT',
      docNumber: '30-71234567-8',
      email: 'compras@construccionesnorte.com',
      phone: '+54 11 4567-8901',
      address: 'Av. Industrial 4500, Buenos Aires',
      creditLimit: new Prisma.Decimal(500000),
    },
  })

  // =========================================================================
  // 2. TENANT B: Rubro Retail / Indumentaria
  // =========================================================================
  console.log('👗 Creando Tenant B (Retail / Indumentaria)...')

  const tenantB = await prisma.tenant.upsert({
    where: { slug: 'urban-style' },
    update: {
      name: 'Urban Style Boutique',
      plan: 'PRO',
      status: 'ACTIVE',
      settings: {
        currency: 'ARS',
        currencySymbol: '$',
        timezone: 'America/Argentina/Buenos_Aires',
        invoicePrefix: 'USB-',
        taxRate: 21,
        taxName: 'IVA',
        companyLegalName: 'Urban Style Moda SRL',
        companyTaxId: '30-87654321-9',
        address: 'Palermo Soho, Honduras 4800, CABA',
        phone: '+54 11 5555-4321',
        email: 'hola@urbanstyle.com',
      } as Prisma.InputJsonValue,
    },
    create: {
      name: 'Urban Style Boutique',
      slug: 'urban-style',
      plan: 'PRO',
      status: 'ACTIVE',
      settings: {
        currency: 'ARS',
        currencySymbol: '$',
        timezone: 'America/Argentina/Buenos_Aires',
        invoicePrefix: 'USB-',
        taxRate: 21,
        taxName: 'IVA',
        companyLegalName: 'Urban Style Moda SRL',
        companyTaxId: '30-87654321-9',
        address: 'Palermo Soho, Honduras 4800, CABA',
        phone: '+54 11 5555-4321',
        email: 'hola@urbanstyle.com',
      } as Prisma.InputJsonValue,
    },
  })

  // Usuario Admin Tenant B
  const userB = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenantB.id,
        email: 'admin@urbanstyle.com',
      },
    },
    update: {
      name: 'Admin Urban Style',
      passwordHash: defaultPasswordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
    create: {
      tenantId: tenantB.id,
      email: 'admin@urbanstyle.com',
      passwordHash: defaultPasswordHash,
      name: 'Admin Urban Style',
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  })

  // Categoría "Remeras" con Dynamic Fields
  const categoryB = await prisma.category.upsert({
    where: {
      tenantId_name: {
        tenantId: tenantB.id,
        name: 'Remeras',
      },
    },
    update: {
      description: 'Remeras de algodón peinado, oversize y estampadas',
      dynamicFieldsConfig: {
        fields: [
          {
            name: 'talle',
            type: 'select',
            label: 'Talle',
            required: true,
            options: [
              { label: 'S', value: 'S' },
              { label: 'M', value: 'M' },
              { label: 'L', value: 'L' },
              { label: 'XL', value: 'XL' },
            ],
          },
          {
            name: 'color',
            type: 'text',
            label: 'Color',
            required: true,
            placeholder: 'ej. Negro, Blanco, Azul',
          },
        ],
      } as Prisma.InputJsonValue,
    },
    create: {
      tenantId: tenantB.id,
      name: 'Remeras',
      description: 'Remeras de algodón peinado, oversize y estampadas',
      dynamicFieldsConfig: {
        fields: [
          {
            name: 'talle',
            type: 'select',
            label: 'Talle',
            required: true,
            options: [
              { label: 'S', value: 'S' },
              { label: 'M', value: 'M' },
              { label: 'L', value: 'L' },
              { label: 'XL', value: 'XL' },
            ],
          },
          {
            name: 'color',
            type: 'text',
            label: 'Color',
            required: true,
            placeholder: 'ej. Negro, Blanco, Azul',
          },
        ],
      } as Prisma.InputJsonValue,
    },
  })

  // 3 Productos de prueba Tenant B
  const productsB = [
    {
      code: 'REM-OV-BLK-L',
      name: 'Remera Oversize Basic Negra',
      description: 'Remera 100% algodón 24/1 corte oversize unisex',
      costPrice: new Prisma.Decimal(8000),
      salePrice: new Prisma.Decimal(16500),
      currentStock: new Prisma.Decimal(30),
      minStock: new Prisma.Decimal(10),
      customAttributes: { talle: 'L', color: 'Negro' },
    },
    {
      code: 'REM-VTG-WHT-M',
      name: 'Remera Estampada Vintage',
      description: 'Remera con estampa en serigrafía tacto cero',
      costPrice: new Prisma.Decimal(9500),
      salePrice: new Prisma.Decimal(19800),
      currentStock: new Prisma.Decimal(4), // ⚠️ Stock Crítico (4 <= 10)
      minStock: new Prisma.Decimal(10),
      customAttributes: { talle: 'M', color: 'Blanco' },
    },
    {
      code: 'REM-LSA-BLU-S',
      name: 'Remera Lisa Cuello Redondo Azul',
      description: 'Remera clásica jersey peinado',
      costPrice: new Prisma.Decimal(7500),
      salePrice: new Prisma.Decimal(15000),
      currentStock: new Prisma.Decimal(25),
      minStock: new Prisma.Decimal(8),
      customAttributes: { talle: 'S', color: 'Azul Marino' },
    },
  ]

  for (const prod of productsB) {
    const existing = await prisma.product.findFirst({
      where: { tenantId: tenantB.id, code: prod.code },
    })

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          ...prod,
          categoryId: categoryB.id,
          customAttributes: prod.customAttributes as unknown as Prisma.InputJsonValue,
        },
      })
    } else {
      await prisma.product.create({
        data: {
          ...prod,
          tenantId: tenantB.id,
          categoryId: categoryB.id,
          customAttributes: prod.customAttributes as unknown as Prisma.InputJsonValue,
        },
      })
    }
  }

  // Cliente de prueba Tenant B
  const clientB = await prisma.client.upsert({
    where: {
      id: 'client-urban-demo-1',
    },
    update: {
      name: 'Laura Martínez',
      docType: 'DNI',
      docNumber: '38123456',
      email: 'laura.martinez@gmail.com',
      phone: '+54 9 11 6543-2109',
      address: 'Calle Florida 820, CABA',
      creditLimit: new Prisma.Decimal(100000),
    },
    create: {
      id: 'client-urban-demo-1',
      tenantId: tenantB.id,
      name: 'Laura Martínez',
      docType: 'DNI',
      docNumber: '38123456',
      email: 'laura.martinez@gmail.com',
      phone: '+54 9 11 6543-2109',
      address: 'Calle Florida 820, CABA',
      creditLimit: new Prisma.Decimal(100000),
    },
  })

  console.log('✅ Seed completado con éxito:')
  console.log(`- Tenant A: ${tenantA.name} (${tenantA.slug}) | Admin: ${userA.email} / admin123`)
  console.log(`- Tenant B: ${tenantB.name} (${tenantB.slug}) | Admin: ${userB.email} / admin123`)
}

main()
  .catch((e) => {
    console.error('❌ Error en ejecución de seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
