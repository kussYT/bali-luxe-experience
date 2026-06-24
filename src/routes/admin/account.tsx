import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy wrong magic links used SITE_URL with an `/admin` suffix. */
export const Route = createFileRoute("/admin/account")({
  beforeLoad: ({ search }) => {
    throw redirect({ to: "/account", search });
  },
});
