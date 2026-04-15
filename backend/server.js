import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 5000);
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY in backend environment.");
  process.exit(1);
}

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

const forwardHeaders = (req) => {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
  };

  const clientAuth = req.header("authorization");
  if (clientAuth) {
    headers.authorization = clientAuth;
  }

  return headers;
};

const streamUpstreamToClient = async (upstream, res) => {
  res.status(upstream.status);
  res.setHeader("Content-Type", upstream.headers.get("content-type") || "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  if (!upstream.body) {
    res.end();
    return;
  }

  const reader = upstream.body.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
    }
  } finally {
    res.end();
  }
};

app.post("/api/generate-code", async (req, res) => {
  try {
    const upstream = await fetch(`${SUPABASE_URL}/functions/v1/generate-code`, {
      method: "POST",
      headers: forwardHeaders(req),
      body: JSON.stringify(req.body || {}),
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      res.status(upstream.status).send(text || "Generation failed");
      return;
    }

    await streamUpstreamToClient(upstream, res);
  } catch {
    res.status(500).json({ error: "Failed to proxy generate-code" });
  }
});

app.post("/api/explain-code", async (req, res) => {
  try {
    const upstream = await fetch(`${SUPABASE_URL}/functions/v1/explain-code`, {
      method: "POST",
      headers: forwardHeaders(req),
      body: JSON.stringify(req.body || {}),
    });

    const text = await upstream.text();
    res.status(upstream.status);
    res.setHeader("Content-Type", upstream.headers.get("content-type") || "application/json");
    res.send(text);
  } catch {
    res.status(500).json({ error: "Failed to proxy explain-code" });
  }
});

app.all("/api/admin/*", async (req, res) => {
  try {
    const routeSuffix = req.path.replace(/^\/api\/admin/, "");
    const targetUrl = `${SUPABASE_URL}/functions/v1/admin-api${routeSuffix}${req.url.includes("?") ? `?${req.url.split("?")[1]}` : ""}`;
    const hasBody = req.method !== "GET" && req.method !== "HEAD" && req.method !== "OPTIONS";

    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers: forwardHeaders(req),
      body: hasBody ? JSON.stringify(req.body || {}) : undefined,
    });

    const text = await upstream.text();
    res.status(upstream.status);
    res.setHeader("Content-Type", upstream.headers.get("content-type") || "application/json");
    res.send(text);
  } catch {
    res.status(500).json({ error: "Failed to proxy admin API" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
