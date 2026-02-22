require('dotenv').config();

const express = require("express");
const { createServer } = require("http");
const path = require("path");
const connectDB = require("./config/db.cjs");
const { registerRoutes } = require("./routes.cjs");

const app = express();
const httpServer = createServer(app);

// MongoDB Connection
connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));



(async () => {
  await registerRoutes(httpServer, app);

  app.use((err, _req, res, next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("Internal Server Error:", err);
    if (res.headersSent) {
      return next(err);
    }
    return res.status(status).json({ message });
  });

  // Serve frontend static files (built via: npm run build)
  const frontendDist = path.join(__dirname, "..", "frontend", "dist");
  app.use(express.static(frontendDist));
  app.get("/{*splat}", (req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
    },
    () => {
      console.log(`Server running on port ${port}`);
    }
  );
})();
