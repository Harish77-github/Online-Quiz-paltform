const express = require("express");
const fs = require("fs");
const path = require("path");

function serveStatic(app) {
  const distPath = path.resolve(__dirname, "..", "dist", "public");

  if (!fs.existsSync(distPath)) {
    return;
  }

  app.use(express.static(distPath));

  app.get(/^(?!\/api).+/, (req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

module.exports = { serveStatic };
