/** Cloudflare bindings when running on Workers (undefined in Vite dev). */
export async function getCloudflareEnv() {
  try {
    const { env } = await import("cloudflare:workers");
    return env;
  } catch {
    return undefined;
  }
}
