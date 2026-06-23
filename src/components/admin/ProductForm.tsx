import { useState } from "react";
import type { Product, ProductCategory, ProductStatus } from "@/lib/catalog-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { uploadProductImages } from "@/lib/admin-api";
import { CmsMediaGuide } from "@/components/admin/CmsMediaGuide";
import { UPLOADS_UNAVAILABLE_MESSAGE, useUploadsAvailable } from "@/lib/use-uploads-available";
import { Plus, X } from "lucide-react";

export type VariantFormRow = {
  id?: string;
  title: string;
  stock: number;
};

export type ProductFormValues = {
  slug: string;
  name: string;
  story: string;
  priceEUR: number;
  compareAtEUR?: number;
  collection: string;
  collectionSlug: string;
  subcategory: string;
  category: ProductCategory;
  variants: VariantFormRow[];
  status: ProductStatus;
  featured: boolean;
  images: string[];
  origin: "Bali" | "France";
};

type ProductFormProps = {
  initial?: Partial<Product>;
  collections: { slug: string; name: string }[];
  onSubmit: (values: ProductFormValues) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
};

const emptyVariant = (): VariantFormRow => ({ title: "", stock: 1 });

function primaryWarehouse(origin: "Bali" | "France") {
  return origin === "France" ? "france" : "bali";
}

function variantsFromProduct(initial?: Partial<Product>): VariantFormRow[] {
  if (!initial?.variants?.length) {
    const wh = primaryWarehouse(initial?.origin === "France" ? "France" : "Bali");
    const stock =
      wh === "france"
        ? (initial?.stockFrance ?? initial?.stock ?? 1)
        : (initial?.stockBali ?? initial?.stock ?? 1);
    return [{ title: "Default", stock }];
  }

  const wh = primaryWarehouse(initial.origin === "France" ? "France" : "Bali");
  return initial.variants.map((v) => ({
    id: v.id,
    title: v.title,
    stock: wh === "france" ? (v.inventory?.france ?? 0) : (v.inventory?.bali ?? 0),
  }));
}

const empty: ProductFormValues = {
  slug: "",
  name: "",
  story: "",
  priceEUR: 0,
  compareAtEUR: undefined,
  collection: "",
  collectionSlug: "",
  subcategory: "",
  category: "hats",
  variants: [{ title: "Default", stock: 1 }],
  status: "published",
  featured: false,
  images: [],
  origin: "Bali",
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function ProductForm({
  initial,
  collections,
  onSubmit,
  onCancel,
  submitLabel = "Save",
}: ProductFormProps) {
  const [values, setValues] = useState<ProductFormValues>(() => ({
    ...empty,
    ...initial,
    variants: variantsFromProduct(initial),
    images: initial?.images?.length ? initial.images : initial?.image ? [initial.image] : [],
  }));
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { available: uploadsAvailable, loading: uploadsLoading } = useUploadsAvailable();

  const set = <K extends keyof ProductFormValues>(key: K, val: ProductFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  const setVariant = (index: number, patch: Partial<VariantFormRow>) => {
    setValues((prev) => ({
      ...prev,
      variants: prev.variants.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    }));
  };

  const addVariant = () => {
    setValues((prev) => ({ ...prev, variants: [...prev.variants, emptyVariant()] }));
  };

  const removeVariant = (index: number) => {
    setValues((prev) => ({
      ...prev,
      variants: prev.variants.length > 1 ? prev.variants.filter((_, i) => i !== index) : prev.variants,
    }));
  };

  const handleCollectionPick = (slug: string) => {
    const col = collections.find((c) => c.slug === slug);
    if (!col) return;
    set("collectionSlug", col.slug);
    set("collection", col.name);
  };

  const handleFiles = async (files: FileList | null) => {
    if (!uploadsAvailable || !files?.length) return;
    const slug = values.slug || slugify(values.name);
    if (!slug) {
      setError("Enter a product name before uploading images.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const { urls } = await uploadProductImages(slug, files);
      set("images", [...values.images, ...urls]);
      if (!values.slug) set("slug", slug);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const slug = values.slug || slugify(values.name);
      const variants = values.variants
        .map((row, i) => ({
          ...row,
          title: row.title.trim() || (i === 0 ? "Default" : ""),
        }))
        .filter((row) => row.title);

      if (variants.length === 0) {
        setError("Add at least one size or variant.");
        setSaving(false);
        return;
      }

      await onSubmit({
        ...values,
        slug,
        variants,
        collectionSlug: values.collectionSlug || slugify(values.collection),
        image: values.images[0] || "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const warehouseLabel = values.origin === "France" ? "Paris" : "Bali";
  const multiSize = values.variants.length > 1 || values.variants.some((v) => v.title && v.title !== "Default");

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">
      {error && <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 p-3">{error}</p>}

      <div className="grid md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label htmlFor="name">Product name *</Label>
          <Input
            id="name"
            value={values.name}
            onChange={(e) => {
              set("name", e.target.value);
              if (!initial?.slug) set("slug", slugify(e.target.value));
            }}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">URL slug</Label>
          <Input id="slug" value={values.slug} onChange={(e) => set("slug", slugify(e.target.value))} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="story">Description</Label>
        <Textarea id="story" rows={5} value={values.story} onChange={(e) => set("story", e.target.value)} />
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label htmlFor="price">Price (EUR) *</Label>
          <Input
            id="price"
            type="number"
            min={0}
            step={1}
            value={values.priceEUR || ""}
            onChange={(e) => set("priceEUR", Number(e.target.value))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="compare">Sale price (EUR)</Label>
          <Input
            id="compare"
            type="number"
            min={0}
            step={1}
            value={values.compareAtEUR ?? ""}
            onChange={(e) =>
              set("compareAtEUR", e.target.value === "" ? undefined : Number(e.target.value))
            }
            placeholder="Optional — lower than list price"
          />
          <p className="text-xs text-muted-foreground">
            If set below the list price, the piece appears under <strong>Sales</strong> in the menu with a
            crossed-out original price.
          </p>
        </div>
      </div>

      <div className="space-y-4 border border-border p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Label>Sizes / variants</Label>
            <p className="text-xs text-muted-foreground mt-1">
              One row for a single-size product, or add S / M / L etc. Stock is for the primary warehouse ({warehouseLabel}).
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addVariant}>
            <Plus className="size-3.5 mr-1" />
            Add size
          </Button>
        </div>

        <div className="space-y-3">
          {values.variants.map((row, index) => (
            <div key={row.id || `new-${index}`} className="grid grid-cols-[1fr_7rem_auto] gap-3 items-end">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  {index === 0 && !multiSize ? "Variant" : `Size ${index + 1}`}
                </Label>
                <Input
                  value={row.title}
                  onChange={(e) => setVariant(index, { title: e.target.value })}
                  placeholder={index === 0 ? "Default or S" : "M, L, XL…"}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Stock ({warehouseLabel})</Label>
                <Input
                  type="number"
                  min={0}
                  value={row.stock}
                  onChange={(e) => setVariant(index, { stock: Number(e.target.value) })}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={() => removeVariant(index)}
                disabled={values.variants.length <= 1}
                aria-label="Remove size"
              >
                <X className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label>Category (collection)</Label>
          <Select value={values.collectionSlug} onValueChange={handleCollectionPick}>
            <SelectTrigger>
              <SelectValue placeholder="Choose collection" />
            </SelectTrigger>
            <SelectContent>
              {collections.map((c) => (
                <SelectItem key={c.slug} value={c.slug}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="subcategory">Subcategory</Label>
          <Input
            id="subcategory"
            value={values.subcategory}
            onChange={(e) => set("subcategory", e.target.value)}
            placeholder="e.g. Wide brim, Kids…"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        <div className="space-y-2">
          <Label>Shop category</Label>
          <Select value={values.category} onValueChange={(v) => set("category", v as ProductCategory)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hats">Hats</SelectItem>
              <SelectItem value="accessories">Accessories</SelectItem>
              <SelectItem value="bags">Bags</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={values.status} onValueChange={(v) => set("status", v as ProductStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Origin</Label>
          <Select value={values.origin} onValueChange={(v) => set("origin", v as "Bali" | "France")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Bali">Bali</SelectItem>
              <SelectItem value="France">France</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={values.featured}
          onChange={(e) => set("featured", e.target.checked)}
          className="size-4"
        />
        Featured on homepage
      </label>

      <div className="space-y-3 border border-border p-5">
        <Label>Images</Label>
        {!uploadsLoading && uploadsAvailable && (
          <Input type="file" accept="image/*" multiple onChange={(e) => handleFiles(e.target.files)} disabled={uploading} />
        )}
        {!uploadsLoading && !uploadsAvailable && (
          <p className="text-sm text-amber-700 dark:text-amber-400">{UPLOADS_UNAVAILABLE_MESSAGE}</p>
        )}
        {uploading && <p className="text-sm text-muted-foreground">Uploading…</p>}
        <CmsMediaGuide compact />
        {values.images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-3">
            {values.images.map((src) => (
              <div key={src} className="relative group aspect-square bg-sand overflow-hidden">
                <img src={src} alt="" className="size-full object-cover" />
                <button
                  type="button"
                  className="absolute inset-x-0 bottom-0 bg-ink/80 text-bone text-xs py-1 opacity-0 group-hover:opacity-100"
                  onClick={() => set("images", values.images.filter((i) => i !== src))}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
