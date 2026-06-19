import { createApp } from "../server/_core/app";

console.log("[Vercel] Initializing Acervus API...");

let app: ReturnType<typeof createApp>;
try {
  app = createApp();
  console.log("[Vercel] Acervus API initialized successfully");
} catch (err) {
  console.error("[Vercel] Failed to initialize API:", err);
  throw err;
}

export default app;
