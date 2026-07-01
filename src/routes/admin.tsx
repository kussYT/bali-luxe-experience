import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminLocaleProvider } from "@/lib/admin-locale";

export const Route = createFileRoute("/admin")({
  component: () => (
    <AdminLocaleProvider>
      <AdminLayout />
    </AdminLocaleProvider>
  ),
});

