import express from "express";

const app = express();

app.all("*", (_req, res) => {
  res.json({ ok: true, message: "API funcionando" });
});

export default app;
