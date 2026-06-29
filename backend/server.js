require("dotenv").config();
const express = require("express");
const cors = require("cors");
const passport = require("passport");
const connectDB = require("./config/db");
require("./config/passport");

const app = express();
connectDB();

app.set("trust proxy", 1);

// CORS — allow both localhost and production frontend
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:5173",
  "http://localhost:5173",
  "http://localhost:5174",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));
app.use(passport.initialize());

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/conversations", require("./routes/conversationRoutes"));
app.use("/api/messages", require("./routes/messageRoutes"));
app.use("/api/shared", require("./routes/sharedRoutes"));

// Health check
app.get("/health", (req, res) =>
  res.json({ status: "ok", time: new Date().toISOString() })
);

// 404 handler
app.use((req, res) =>
  res.status(404).json({ message: `Route ${req.path} not found` })
);

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🐯 Tiger AI server running on port ${PORT}`));
