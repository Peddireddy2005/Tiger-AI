const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: "All fields required" });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: "Invalid email" });
    if (password.length < 6) return res.status(400).json({ message: "Password min 6 characters" });
    if (await User.findOne({ email })) return res.status(400).json({ message: "Email already in use" });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed });
    const token = generateToken(user._id);
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar } });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });
    const token = generateToken(user._id);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar } });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user).select("-password");
    if (!user) return res.status(404).json({ message: "Not found" });
    res.json({ id: user._id, name: user.name, email: user.email, avatar: user.avatar });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const googleAuth = passport.authenticate("google", { scope: ["profile", "email"], session: false });

const googleCallback = (req, res, next) => {
  passport.authenticate("google", { session: false }, (err, data) => {
    if (err || !data) return res.redirect(`${process.env.FRONTEND_URL}/login?error=google_failed`);
    const { token, user } = data;
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}&name=${encodeURIComponent(user.name)}&email=${encodeURIComponent(user.email)}&id=${user._id}&avatar=${encodeURIComponent(user.avatar || "")}`);
  })(req, res, next);
};

module.exports = { registerUser, loginUser, getMe, googleAuth, googleCallback };