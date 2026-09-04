import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { createClient } from '@supabase/supabase-js';

async function checkHealth() {
  console.log('🔍 Chequeando estado de Supabase y PostgreSQL...\n');

  // 1. Supabase REST API
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { error } = await supabase.from('User').select('count', { count: 'exact', head: true });
    if (!error) {
      console.log('✅ Supabase REST API: Conectado y respondiendo OK');
    } else {
      console.log('ℹ️  Supabase REST API:', error.message);
    }
  }

  // 2. Prisma Client & PostgreSQL
  const { prisma } = await import('../src/lib/prisma');
  try {
    const userCount = await prisma.user.count();
    const tenantCount = await prisma.tenant.count();
    const productCount = await prisma.product.count();
    const saleCount = await prisma.sale.count();

    console.log('✅ PostgreSQL / Prisma: Conexión exitosa a Supabase.');
    console.log('   - Tenants registrados:', tenantCount);
    console.log('   - Usuarios registrados:', userCount);
    console.log('   - Productos registrados:', productCount);
    console.log('   - Ventas registradas:', saleCount);
  } catch (err: any) {
    console.error('❌ Error en PostgreSQL / Prisma:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkHealth();
