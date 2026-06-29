const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { sendMessage, streamMessage, regenerateMessage, reactToMessage, exportConversation, getMessages } = require("../controllers/messageController");

router.post("/", protect, sendMessage);
router.post("/stream", protect, streamMessage);
router.post("/regenerate", protect, regenerateMessage);
router.patch("/:messageId/react", protect, reactToMessage);
router.get("/export/:conversationId", protect, exportConversation);
router.get("/:conversationId", protect, getMessages);

module.exports = router;
