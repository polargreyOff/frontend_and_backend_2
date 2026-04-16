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
const reminders = new Map();
const SNOOZE_DELAY_MS = 30 * 1000;

async function sendPushToAll(payload) {
  const results = await Promise.allSettled(
    subscriptions.map((entry) =>
      webpush.sendNotification(entry.subscription, JSON.stringify(payload))
    )
  );

  subscriptions = subscriptions.filter((entry, index) => {
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
}

function scheduleReminder(task) {
  const existingReminder = reminders.get(task.id);
  if (existingReminder?.timeoutId) {
    clearTimeout(existingReminder.timeoutId);
  }

  const delay = task.reminder - Date.now();
  if (delay <= 0) {
    return false;
  }

  const timeoutId = setTimeout(async () => {
    await sendPushToAll({
      title: "Напоминание",
      body: task.title,
      reminderId: task.id,
    });

    io.emit("reminderTriggered", task);
    reminders.set(task.id, {
      timeoutId: null,
      task,
      triggeredAt: Date.now(),
    });
  }, delay);

  reminders.set(task.id, {
    timeoutId,
    task,
  });

  return true;
}

app.get("/push-public-key", (_req, res) => {
  res.json({ publicKey: vapidKeys.publicKey });
});

app.post("/subscribe", (req, res) => {
  const subscription = req.body;
  const userAgent = req.headers["user-agent"] || "unknown-browser";

  if (!subscription?.endpoint) {
    return res.status(400).json({ error: "Subscription endpoint is required" });
  }

  subscriptions = subscriptions.filter(
    (item) =>
      item.subscription.endpoint !== subscription.endpoint && item.userAgent !== userAgent
  );

  subscriptions.push({ subscription, userAgent });

  return res.status(201).json({ message: "Подписка сохранена" });
});

app.post("/unsubscribe", (req, res) => {
  const { endpoint } = req.body;

  subscriptions = subscriptions.filter((item) => item.subscription.endpoint !== endpoint);
  res.json({ message: "Подписка удалена" });
});

app.post("/snooze", (req, res) => {
  const reminderId = String(req.query.reminderId || "");

  if (!reminderId || !reminders.has(reminderId)) {
    return res.status(404).json({ error: "Reminder not found" });
  }

  const existing = reminders.get(reminderId);
  if (existing.timeoutId) {
    clearTimeout(existing.timeoutId);
  }

  const updatedTask = {
    ...existing.task,
    reminder: Date.now() + SNOOZE_DELAY_MS,
  };

  scheduleReminder(updatedTask);
  return res.json({ message: "Reminder snoozed for 30 seconds" });
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
    await sendPushToAll({
      title: "Новая заметка",
      body: `${task.title}: ${task.body}`,
    });
  });

  socket.on("newReminder", (task) => {
    const payload = {
      ...task,
      sourceSocketId: socket.id,
    };

    io.emit("taskAdded", payload);
    scheduleReminder(task);
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
