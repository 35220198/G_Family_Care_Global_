const http = require("http");
const fs = require("fs");
const path = require("path");

const root = process.cwd();
const port = 8000;

const mime = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".txt": "text/plain",
  ".xml": "application/xml"
};

http.createServer((req, res) => {
  let pathname = decodeURIComponent(
    new URL(req.url, "http://localhost").pathname
  );

  if (pathname === "/") pathname = "/index.html";

  let file = path.resolve(root, "." + pathname);

  if (!file.startsWith(root + path.sep) && file !== root) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    file = path.join(file, "index.html");
  }

  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(err.code === "ENOENT" ? 404 : 500);
      return res.end("File not found");
    }

    res.writeHead(200, {
      "Content-Type": mime[path.extname(file).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-store"
    });

    res.end(data);
  });
}).listen(port, () => {
  console.log(`GFamily server running at http://localhost:${port}`);
});
