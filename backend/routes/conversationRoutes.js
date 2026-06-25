const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  createConversation, getConversations, searchConversations,
  updateConversation, deleteConversation, mergeConversations,
  splitConversation, shareConversation,
} = require("../controllers/conversationController");

router.post("/", protect, createConversation);
router.get("/", protect, getConversations);
router.get("/search", protect, searchConversations);
router.post("/merge", protect, mergeConversations);
router.put("/:id", protect, updateConversation);
router.delete("/:id", protect, deleteConversation);
router.post("/:id/split", protect, splitConversation);
router.post("/:id/share", protect, shareConversation);

module.exports = router;