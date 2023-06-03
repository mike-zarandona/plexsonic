const { createServer } = require("http");
const WebSocket = require("ws");
const { parse } = require("url");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();
port = 3000;

app.prepare().then(() => {
  const server = createServer((req, res) =>
    handle(req, res, parse(req.url, true))
  );
  const wss = new WebSocket.Server({ noServer: true });

  wss.on("connection", async function connection(ws) {
    console.log("incoming connection", Object.keys(ws));
    ws.onclose = () => {
      console.log("connection closed", wss.clients.size);
    };
  });

  server.on("upgrade", function (req, socket, head) {
    const { pathname } = parse(req.url, true);
    if (pathname !== "/_next/webpack-hmr") {
      wss.handleUpgrade(req, socket, head, function done(ws) {
        wss.emit("connection", ws, req);
      });
    }
  });

  server.on("message", function (req, socket, head) {
    const { pathname } = parse(req.url, true);
    if (pathname !== "/_next/webpack-hmr") {
      wss.handleUpgrade(req, socket, head, function done(ws) {
        wss.emit("connection", ws, req);
      });
    }
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(
      `> Starting servers on http://localhost:${port} and ws://localhost:${port}`
    );
  });
});
