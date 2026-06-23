import { createFileRoute } from "@tanstack/react-router";
import { serveUploadedFile } from "../../../server/uploads.mjs";
import { getCloudflareEnv } from "../../../server/cf-env.mjs";

async function handler({ request }) {
  const url = new URL(request.url);
  const keyPath = url.pathname;
  const env = await getCloudflareEnv();
  const file = await serveUploadedFile(keyPath, env, request);

  if (!file) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(file.body, {
    status: file.status,
    headers: file.headers,
  });
}

export const Route = createFileRoute("/uploads/$")({
  server: {
    handlers: {
      GET: handler,
    },
  },
});
