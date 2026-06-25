const express = require("express");
const router = express.Router();
const { getSharedChat } = require("../controllers/sharedController");

router.get("/:shareId", getSharedChat);

module.exports = router;