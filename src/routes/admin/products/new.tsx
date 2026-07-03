import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { createProduct, fetchAdminCatalog } from "@/lib/admin-api";
import { ProductForm, type ProductFormValues } from "@/components/admin/ProductForm";
import { useCatalog } from "@/lib/catalog-context";

export const Route = createFileRoute("/admin/products/new")({
  head: () => ({ meta: [{ title: "New product — Admin" }] }),
  component: AdminNewProductPage,
});

function AdminNewProductPage() {
  const navigate = useNavigate();
  const { refresh } = useCatalog();
  const [collections, setCollections] = useState<{ slug: string; name: string }[]>([]);

  useEffect(() => {
    fetchAdminCatalog().then((catalog) => setCollections(catalog.collections));
  }, []);

  const handleSubmit = async (values: ProductFormValues) => {
    await createProduct(values);
    await refresh();
    navigate({ to: "/admin/products" });
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-eyebrow text-muted-foreground">Products</p>
        <h2 className="font-display text-4xl mt-2">Add product</h2>
      </div>
      <ProductForm
        collections={collections}
        submitLabel="Publish product"
        onSubmit={handleSubmit}
        onCancel={() => navigate({ to: "/admin/products" })}
      />
    </div>
  );
}

