import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';
import { getProductsForBulkEdit } from '@/lib/catalog';
import { PRODUCT_COLUMNS, toCsv } from '@/lib/csv';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  if (!(await getAdminSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const ids = (new URL(request.url).searchParams.get('ids') || '').split(',').map((id) => id.trim()).filter(Boolean);
  const products = await getProductsForBulkEdit(ids);
  const header = [...PRODUCT_COLUMNS.map((column) => column.header), 'Metal options (reference only)', 'Tags'];
  const rows = products.map((product) => [
    product.title,
    product.shortTitle && product.shortTitle !== product.title ? product.shortTitle : '',
    product.slug,
    product.variants?.[0]?.price ?? product.price,
    product.category,
    product.status.charAt(0).toUpperCase() + product.status.slice(1),
    product.metal,
    product.stone,
    product.caratWeight || '',
    product.description,
    (product.images || []).join('|'),
    (product.variants || []).map((variant) => `${variant.title}: ${variant.price}`).join(' | '),
    (product.tags || []).join(', '),
  ]);
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse('﻿' + toCsv([header, ...rows]), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="byshreen-products-${date}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
