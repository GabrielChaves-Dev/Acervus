import { createApp, serveStatic } from "../server/_core/index";

const app = createApp();
serveStatic(app);

export default app;
