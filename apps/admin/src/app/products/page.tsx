import { db } from "@/lib/db";
import { products, organizations } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { Package } from "lucide-react";
import { ProductsClient } from "./products-client";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const prods = await db.select({
    id: products.id,
    org_id: products.org_id,
    name: products.name,
    description: products.description,
    price: products.price,
    currency: products.currency,
    category: products.category,
    product_type: products.product_type,
    inventory_count: products.inventory_count,
    is_active: products.is_active,
    created_at: products.created_at,
    org_name: organizations.name,
  })
    .from(products)
    .leftJoin(organizations, eq(products.org_id, organizations.id))
    .orderBy(desc(products.created_at))
    .limit(500);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-serif font-black text-slate-900 italic tracking-tight">Products</h1>
        <p className="text-xs text-slate-400 font-black uppercase tracking-[0.2em] mt-1">All products across all organizations</p>
      </div>
      <ProductsClient initialData={prods} />
    </div>
  );
}
