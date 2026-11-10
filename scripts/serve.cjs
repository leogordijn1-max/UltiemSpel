const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const port = Number(process.env.PORT || 4173);
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};
const threeBuildFiles = new Map([
  ["/vendor/three/three.module.js", "three.module.js"],
  ["/vendor/three/three.core.js", "three.core.js"],
]);

const server = http.createServer((request, response) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  } catch {
    response.writeHead(400).end("Bad request");
    return;
  }

  if (pathname === "/") pathname = "/index.html";
  else if (pathname.endsWith("/")) pathname += "index.html";
  const segments = pathname.split(/[\\/]+/).filter(Boolean);
  if (segments.some((segment) => segment.startsWith(".") || segment.toLowerCase() === "node_modules")) {
    response.writeHead(404).end("Not found");
    return;
  }

  const file = threeBuildFiles.has(pathname)
    ? path.join(root, "node_modules", "three", "build", threeBuildFiles.get(pathname))
    : path.resolve(root, `.${pathname.replace(/\//g, path.sep)}`);
  const relative = path.relative(root, file);
  if (relative.startsWith("..") || path.isAbsolute(relative) || !mimeTypes[path.extname(file).toLowerCase()]) {
    response.writeHead(404).end("Not found");
    return;
  }

  fs.stat(file, (statError, stat) => {
    if (statError || !stat.isFile()) {
      response.writeHead(404).end("Not found");
      return;
    }
    response.writeHead(200, {
      "Cache-Control": "no-store",
      "Content-Length": stat.size,
      "Content-Type": mimeTypes[path.extname(file).toLowerCase()],
      "X-Content-Type-Options": "nosniff",
    });
    fs.createReadStream(file).pipe(response);
  });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Shadow Survivor QA server listening on http://127.0.0.1:${port}`);
});

server.on("error", (error) => {
  console.error("Could not start the Shadow Survivor QA server:", error);
  process.exitCode = 1;
});

function shutdown(signal) {
  server.close((error) => {
    if (error) {
      console.error(`Could not stop the Shadow Survivor QA server after ${signal}:`, error);
      process.exitCode = 1;
    }
    process.exit();
  });
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
