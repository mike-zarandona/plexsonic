const express = require("express");
const multer = require("multer");
const socketIO = require("socket.io");
const next = require("next");
const sha1 = require("sha1");

const dev = process.env.NODE_ENV !== "production";
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

const port = process.env.PORT || 3000;

nextApp.prepare().then(() => {
  // Create an instance of the Express server
  const app = express();
  const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
  const io = socketIO(server);

  // Initialize an empty array to store connected clients
  let clients = [];

  // Create a WebSocket server
  io.on("connection", (socket) => {
    // Add the connected socket to the clients array
    clients.push(socket);

    // Remove the disconnected socket from the clients array
    socket.on("disconnect", () => {
      clients = clients.filter((client) => client !== socket);
    });
  });

  // Create a storage engine for multer
  const storage = multer.memoryStorage();
  const upload = multer({ storage });

  // Define your route for the Plex webhook
  app.post("/webhook", upload.single("thumb"), async (req, res) => {
    const payload = JSON.parse(req.body.payload);
  server.on("message", function (req, socket, head) {
    const { pathname } = parse(req.url, true);
    if (pathname !== "/_next/webpack-hmr") {
      wss.handleUpgrade(req, socket, head, function done(ws) {
        wss.emit("connection", ws, req);
      });
    }
    // Access the parsed payload data
    const payloadData = JSON.stringify(req.body.payload);
    // Emit the data to all connected WebSocket clients
    clients.forEach((client) => {
      client.emit("payload", payloadData);
    });

    // Send a response if necessary
    res.status(200).send("Webhook received");
  });

  // Handle other Next.js requests
  app.get("*", (req, res) => {
    return handle(req, res);
  });
});
