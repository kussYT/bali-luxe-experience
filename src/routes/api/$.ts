import { createFileRoute } from "@tanstack/react-router";
import { handleApiRequest } from "../../../server/api-router.mjs";
import { getCloudflareEnv } from "../../../server/cf-env.mjs";

async function handler({ request }) {
  const env = await getCloudflareEnv();
  const response = await handleApiRequest(request, { env });
  if (response) return response;
  return Response.json({ error: "Not found" }, { status: 404 });
}

export const Route = createFileRoute("/api/$")({
  server: {
    handlers: {
      GET: handler,
      POST: handler,
      PUT: handler,
      PATCH: handler,
      DELETE: handler,
    },
  },
});
