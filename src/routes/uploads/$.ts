import { createFileRoute } from "@tanstack/react-router";
import { getUploadedImage } from "../../../server/uploads.mjs";
import { getCloudflareEnv } from "../../../server/cf-env.mjs";

async function handler({ request }) {
  const url = new URL(request.url);
  const keyPath = url.pathname;
  const env = await getCloudflareEnv();
  const file = await getUploadedImage(keyPath, env);

  if (!file) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(file.body, {
    status: 200,
    headers: {
      "Content-Type": file.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

export const Route = createFileRoute("/uploads/$")({
  server: {
    handlers: {
      GET: handler,
    },
  },
});
