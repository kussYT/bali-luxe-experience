import type { Catalog, Product } from "@/lib/catalog-types";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data as T;
}

export async function fetchPublicCatalog() {
  return request<Catalog>("/api/catalog");
}

export async function fetchAdminCatalog() {
  return request<Catalog>("/api/admin/catalog");
}

export async function checkAdminSession() {
  return request<{ authenticated: boolean }>("/api/admin/me");
}

export async function adminLogin(password: string) {
  return request<{ ok: boolean }>("/api/admin/login", {
    method: "POST",
    body: JSON.stringify({ password }),
  });
}

export async function adminLogout() {
  return request<{ ok: boolean }>("/api/admin/logout", { method: "POST" });
}

export async function createProduct(product: Partial<Product>) {
  return request<{ product: Product; catalog: Catalog }>("/api/admin/products", {
    method: "POST",
    body: JSON.stringify(product),
  });
}

export async function updateProduct(slug: string, product: Partial<Product>) {
  return request<{ product: Product; catalog: Catalog }>(`/api/admin/products/${encodeURIComponent(slug)}`, {
    method: "PUT",
    body: JSON.stringify(product),
  });
}

export async function deleteProduct(slug: string) {
  return request<{ ok: boolean; catalog: Catalog }>(`/api/admin/products/${encodeURIComponent(slug)}`, {
    method: "DELETE",
  });
}

export async function uploadProductImages(slug: string, files: FileList | File[]) {
  const form = new FormData();
  for (const file of files) form.append("images", file);
  const res = await fetch(`/api/admin/upload?slug=${encodeURIComponent(slug)}`, {
    method: "POST",
    body: form,
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Upload failed");
  return data as { urls: string[] };
}
