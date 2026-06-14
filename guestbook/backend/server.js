// ============================================================
// Guestbook Backend API (ExpressJS)
// - Luu loi nhan vao MEMORY (RAM cua process)
// - Co health endpoints (/healthz, /readyz) de K8s probe
// - Version duoc inject qua bien moi truong APP_VERSION
// ------------------------------------------------------------
// LUU Y QUAN TRONG ve "in-memory":
//   Moi pod backend co vung nho RIENG. Khi co 3 replicas,
//   loi nhan ban POST vao pod A se KHONG thay o pod B.
//   Day la han che cua state in-memory. Production that su
//   phai dung shared store (Redis / Postgres). Xem README.
// ============================================================

const express = require("express");

const app = express();
app.use(express.json());

// Version cua app, set khi build image (build-arg) hoac deploy (env)
const APP_VERSION = process.env.APP_VERSION || "v1";
const PORT = parseInt(process.env.PORT || "8080", 10);

// Ten pod (K8s tu set HOSTNAME = ten pod) -> de quan sat load balancing
const POD_NAME = process.env.HOSTNAME || "local";

// Co de GIA LAP loi readiness (dung de demo rollback zero-downtime)
// Neu = "true" thi /readyz tra ve 503 -> K8s khong route traffic vao pod
const FAIL_READINESS = process.env.FAIL_READINESS === "true";

// "Database" in-memory
let messages = [];
let nextId = 1;

// --- Logging don gian cho moi request ---
app.use((req, _res, next) => {
  console.log(`[${APP_VERSION}][${POD_NAME}] ${req.method} ${req.url}`);
  next();
});

// ============================================================
// HEALTH ENDPOINTS
// ============================================================

// Liveness: pod con "song" khong? Neu fail -> K8s RESTART pod.
// Chi nen check nhung thu nghiem trong (process treo, deadlock...).
app.get("/healthz", (_req, res) => {
  res.status(200).json({ status: "ok", version: APP_VERSION, pod: POD_NAME });
});

// Readiness: pod da SAN SANG nhan traffic chua? Neu fail -> K8s
// go pod khoi Service endpoints (KHONG restart). Day la chia khoa
// cho rolling update zero-downtime.
app.get("/readyz", (_req, res) => {
  if (FAIL_READINESS) {
    return res
      .status(503)
      .json({ status: "not-ready", reason: "FAIL_READINESS=true", version: APP_VERSION });
  }
  res.status(200).json({ status: "ready", version: APP_VERSION, pod: POD_NAME });
});

// Tien ich: xem nhanh version dang chay
app.get("/version", (_req, res) => {
  res.status(200).json({ version: APP_VERSION, pod: POD_NAME });
});

// ============================================================
// BUSINESS API
// ============================================================

// Lay danh sach loi nhan
app.get("/messages", (_req, res) => {
  res.status(200).json({
    version: APP_VERSION,
    pod: POD_NAME,
    count: messages.length,
    messages,
  });
});

// Them mot loi nhan
app.post("/messages", (req, res) => {
  const { name, message } = req.body || {};

  if (!name || !message) {
    return res.status(400).json({ error: "name va message la bat buoc" });
  }

  const entry = {
    id: nextId++,
    name: String(name).slice(0, 100),
    message: String(message).slice(0, 500),
    // v2 bo sung timestamp - giup quan sat su khac biet giua cac version
    createdAt: new Date().toISOString(),
    servedBy: POD_NAME,
    version: APP_VERSION,
  };

  messages.push(entry);
  console.log(`[${APP_VERSION}][${POD_NAME}] new message #${entry.id} from ${entry.name}`);

  res.status(201).json(entry);
});

// Root
app.get("/", (_req, res) => {
  res.status(200).json({
    service: "guestbook-backend",
    version: APP_VERSION,
    pod: POD_NAME,
  });
});

// ============================================================
// GRACEFUL SHUTDOWN (quan trong cho zero-downtime)
//   Khi K8s xoa pod, no gui SIGTERM. Ta phai dong server
//   nhe nhang, ngung nhan ket noi moi -> khong dut request.
// ============================================================
const server = app.listen(PORT, () => {
  console.log(`Guestbook backend ${APP_VERSION} listening on :${PORT} (pod=${POD_NAME})`);
});

function shutdown(signal) {
  console.log(`Nhan ${signal}, dang graceful shutdown...`);
  server.close(() => {
    console.log("Server da dong. Bye.");
    process.exit(0);
  });
  // Phong truong hop treo, ep thoat sau 10s
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
