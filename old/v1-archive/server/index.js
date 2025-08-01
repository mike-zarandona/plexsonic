const express = require("express");
const multer = require("multer");
const socketIO = require("socket.io");
const next = require("next");
const userConfig = require("../.config");

const dev = process.env.NODE_ENV !== "production";
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

const port = process.env.PORT || 3000;

nextApp.prepare().then(() => {
  let latestPayload;

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

    // if there's valid payload data, emit it on connect
    if (latestPayload !== undefined) {
      clients.forEach((client) => {
        client.emit("payload", latestPayload);
      });
    }

    // Remove the disconnected socket from the clients array
    socket.on("disconnect", () => {
      clients = clients.filter((client) => client !== socket);
    });
  });

  // Create a storage engine for multer
  // const storage = multer.memoryStorage();
  // const upload = multer({ storage });
  const storage = multer.diskStorage({
    destination: "./tmp",
    filename: function (req, file, cb) {
      cb(null, "thumb.jpg");
    },
  });
  const upload = multer({ storage });

  // Define your route for the Plex webhook
  app.post("/webhook", upload.single("thumb"), async (req, res) => {
    const payload = JSON.parse(req.body.payload);
    const isAudio = payload.Metadata.type === "track";
    // const isVideo = ["movie", "episode"].includes(payload.Metadata.type);

    // only continue with this webhook payload if it's for the correct user
    if (payload.Account.title !== userConfig.user.username || !isAudio) return;

    latestPayload = req.body.payload;

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
