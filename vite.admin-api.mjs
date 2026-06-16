import { handleApiRequest } from "./server/api-router.mjs";

function nodeHeadersToFetch(nodeHeaders) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(nodeHeaders)) {
    if (value == null) continue;
    headers.set(key, Array.isArray(value) ? value.join(", ") : String(value));
  }
  return headers;
}

async function readNodeBody(nodeReq) {
  const chunks = [];
  for await (const chunk of nodeReq) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function sendFetchResponse(nodeRes, response) {
  nodeRes.statusCode = response.status;
  response.headers.forEach((value, key) => {
    nodeRes.setHeader(key, value);
  });
  const buf = Buffer.from(await response.arrayBuffer());
  nodeRes.end(buf);
}

export function adminApiPlugin() {
  return {
    name: "bingin-admin-api",
    configureServer(server) {
      server.middlewares.use(async (nodeReq, nodeRes, next) => {
        if (!nodeReq.url?.startsWith("/api/")) return next();

        const host = nodeReq.headers.host || "localhost:8080";
        const url = `http://${host}${nodeReq.url}`;
        const method = nodeReq.method || "GET";
        let body;
        if (method !== "GET" && method !== "HEAD") {
          body = await readNodeBody(nodeReq);
        }

        const request = new Request(url, {
          method,
          headers: nodeHeadersToFetch(nodeReq.headers),
          body: body?.length ? body : undefined,
        });

        try {
          const response = await handleApiRequest(request);
          if (!response) return next();
          await sendFetchResponse(nodeRes, response);
        } catch (err) {
          nodeRes.statusCode = err.status || 500;
          nodeRes.setHeader("Content-Type", "application/json");
          nodeRes.end(JSON.stringify({ error: err.message || "Server error" }));
        }
      });
    },
    configurePreviewServer(server) {
      this.configureServer(server);
    },
  };
}
