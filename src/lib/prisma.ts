import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  const connectionString =
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/gestion_manager?schema=public'

  const isSupabaseOrRemote =
    connectionString.includes('supabase.com') ||
    connectionString.includes('supabase.co') ||
    connectionString.includes('sslmode=')

  // When connecting to Supabase in Node.js, pass explicit SSL options and strip sslmode to avoid SELF_SIGNED_CERT_IN_CHAIN
  const cleanConnectionString = isSupabaseOrRemote
    ? connectionString.replace(/[?&]sslmode=[^&]+/, '').replace(/\?$/, '')
    : connectionString

  const pool = new Pool({
    connectionString: cleanConnectionString,
    ssl: isSupabaseOrRemote ? { rejectUnauthorized: false } : undefined,
  })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton> | undefined
} & typeof global

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma
}

export default prisma
