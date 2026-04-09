const fs = require("fs");
const path = require("path");
const http = require("http");
const https = require("https");
const express = require("express");
const socketIo = require("socket.io");
const webpush = require("web-push");
const bodyParser = require("body-parser");
const cors = require("cors");

const PORT = Number(process.env.PORT) || 3001;
const HOST = "localhost";
const app = express();
const staticDir = __dirname;
const certPath = path.join(__dirname, "localhost.pem");
const keyPath = path.join(__dirname, "localhost-key.pem");
const vapidKeysPath = path.join(__dirname, "vapid-keys.json");

function loadOrCreateVapidKeys() {
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    return {
      publicKey: process.env.VAPID_PUBLIC_KEY,
      privateKey: process.env.VAPID_PRIVATE_KEY,
    };
  }

  if (fs.existsSync(vapidKeysPath)) {
    return JSON.parse(fs.readFileSync(vapidKeysPath, "utf-8"));
  }

  const generatedKeys = webpush.generateVAPIDKeys();
  fs.writeFileSync(vapidKeysPath, JSON.stringify(generatedKeys, null, 2));
  return generatedKeys;
}

const vapidKeys = loadOrCreateVapidKeys();

webpush.setVapidDetails(
  "mailto:student@example.com",
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(staticDir));

let subscriptions = [];

app.get("/push-public-key", (_req, res) => {
  res.json({ publicKey: vapidKeys.publicKey });
});

app.post("/subscribe", (req, res) => {
  const subscription = req.body;

  if (!subscription?.endpoint) {
    return res.status(400).json({ error: "Subscription endpoint is required" });
  }

  const exists = subscriptions.some((item) => item.endpoint === subscription.endpoint);
  if (!exists) {
    subscriptions.push(subscription);
  }

  return res.status(201).json({ message: "Подписка сохранена" });
});

app.post("/unsubscribe", (req, res) => {
  const { endpoint } = req.body;

  subscriptions = subscriptions.filter((item) => item.endpoint !== endpoint);
  res.json({ message: "Подписка удалена" });
});

function createServer() {
  const hasCertificates = fs.existsSync(certPath) && fs.existsSync(keyPath);

  if (hasCertificates) {
    return {
      server: https.createServer(
        {
          cert: fs.readFileSync(certPath),
          key: fs.readFileSync(keyPath),
        },
        app
      ),
      protocol: "https",
      secure: true,
    };
  }

  return {
    server: http.createServer(app),
    protocol: "http",
    secure: false,
  };
}

const { server, protocol, secure } = createServer();
const io = socketIo(server, {
  cors: {
    origin: true,
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("Socket client connected:", socket.id);

  socket.on("newTask", async (task) => {
    const payload = {
      ...task,
      sourceSocketId: socket.id,
    };

    io.emit("taskAdded", payload);

    const notificationPayload = JSON.stringify({
      title: "Новая заметка",
      body: `${task.title}: ${task.body}`,
    });

    const results = await Promise.allSettled(
      subscriptions.map((subscription) =>
        webpush.sendNotification(subscription, notificationPayload)
      )
    );

    subscriptions = subscriptions.filter((subscription, index) => {
      const result = results[index];
      if (result.status === "fulfilled") {
        return true;
      }

      const statusCode = result.reason?.statusCode;
      if (statusCode === 404 || statusCode === 410) {
        return false;
      }

      console.error("Push error:", result.reason);
      return true;
    });
  });

  socket.on("disconnect", () => {
    console.log("Socket client disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server started on ${protocol}://${HOST}:${PORT}`);
  console.log(`Secure mode: ${secure ? "enabled" : "disabled"}`);
  console.log(`VAPID public key: ${vapidKeys.publicKey}`);

  if (!secure) {
    console.log(
      "HTTPS certificates not found. Add localhost.pem and localhost-key.pem to enable secure mode."
    );
  }
});
