const path = require("path");
const fs = require("fs");
const { createServer } = require("vite");

async function setupVite(httpServer, app) {
  const vite = await createServer({
    server: {
      middlewareMode: true,
      hmr: { server: httpServer },
    },
    appType: "custom",
  });

  app.use(vite.middlewares);

  app.use(async (req, res, next) => {
    const url = req.originalUrl;
    if (url.startsWith("/api")) {
      return next();
    }

    try {
      const clientIndex = path.resolve(__dirname, "..", "frontend", "index.html");
      let template = fs.readFileSync(clientIndex, "utf-8");
      template = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(template);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}

module.exports = { setupVite };
