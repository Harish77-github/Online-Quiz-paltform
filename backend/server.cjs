require('dotenv').config();

const express = require("express");
const { createServer } = require("http");
const cors = require("cors");
const connectDB = require("./config/db.cjs");
const { registerRoutes } = require("./routes.cjs");

const app = express();
const httpServer = createServer(app);

// MongoDB Connection
connectDB();

// CORS — guaranteed production fix: accept all origins dynamically
app.use(cors({
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Explicit CORS headers middleware (permanent fallback)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

(async () => {
  await registerRoutes(httpServer, app);

  // Global error handler
  app.use((err, _req, res, next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("Internal Server Error:", err);
    if (res.headersSent) {
      return next(err);
    }
    return res.status(status).json({ message });
  });

  const port = parseInt(process.env.PORT || "5000", 10);
  app.listen(port, "0.0.0.0", () => {
    console.log(`Server running on port ${port}`);
  });
})();