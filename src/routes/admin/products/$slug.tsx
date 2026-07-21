import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { fetchAdminCatalog, updateProduct } from "@/lib/admin-api";
import { ProductForm, type ProductFormValues } from "@/components/admin/ProductForm";
import { ProductLocaleEditor } from "@/components/admin/ProductLocaleEditor";
import type { Product } from "@/lib/catalog-types";
import { useCatalog } from "@/lib/catalog-context";
import { resolveProductLocaleFields } from "@/lib/product-locale";

export const Route = createFileRoute("/admin/products/$slug")({
  head: ({ params }) => ({ meta: [{ title: `Edit ${params.slug} — Admin` }] }),
  component: AdminEditProductPage,
});

function AdminEditProductPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { refresh } = useCatalog();
  const [product, setProduct] = useState<Product | null>(null);
  const [collections, setCollections] = useState<{ slug: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminCatalog()
      .then((catalog) => {
        const found = catalog.products.find((p) => p.slug === slug);
        setProduct(found ?? null);
        setCollections(catalog.collections);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <p className="text-muted-foreground">Loading product…</p>;
  if (!product) return <p className="text-destructive">Product not found.</p>;

  const handleSubmit = async (values: ProductFormValues) => {
    const fr = resolveProductLocaleFields({ ...product, locales: product.locales }, "fr");
    await updateProduct(slug, {
      ...values,
      name: fr.name || values.name,
      story: fr.story || values.story,
      seoTitle: fr.seoTitle || values.seoTitle,
      metaDescription: fr.metaDescription || values.metaDescription,
      locales: product.locales,
    });
    await refresh();
    navigate({ to: "/admin/products" });
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-eyebrow text-muted-foreground">Products</p>
        <h2 className="font-display text-4xl mt-2">Edit product</h2>
      </div>

      <ProductLocaleEditor
        product={product}
        onChange={(locales) => setProduct({ ...product, locales })}
      />

      <ProductForm
        initial={product}
        collections={collections}
        hideLocalizedFields
        submitLabel="Save changes"
        onSubmit={handleSubmit}
        onCancel={() => navigate({ to: "/admin/products" })}
      />
    </div>
  );
}
