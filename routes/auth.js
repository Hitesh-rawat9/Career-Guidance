const express = require("express")
const router = express.Router()
const bcrypt = require("bcryptjs")
const User = require("../models/user")

// Helper to wrap async routes with error handling
const asyncHandler = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

// POST /api/signup
router.post("/signup", asyncHandler(async (req, res) => {
  const { name, email, password } = req.body

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "All fields required" })
  }

  const existingUser = await User.findOne({ email })
  if (existingUser) {
    return res.status(400).json({ success: false, message: "Email already registered" })
  }

  const hash = await bcrypt.hash(password, 10)

  const user = new User({ name, email, password: hash })
  await user.save()

  res.json({ success: true, message: "Signup successful" })
}))

// POST /api/login
router.post("/login", asyncHandler(async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password required" })
  }

  const user = await User.findOne({ email })
  if (!user) {
    return res.status(401).json({ success: false, message: "User not found" })
  }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    return res.status(401).json({ success: false, message: "Wrong password" })
  }

  res.json({
    success: true,
    message: "Login successful",
    user: {
      id: user._id,
      name: user.name,
      email: user.email
    }
  })
}))

// POST /api/logout
router.post("/logout", (req, res) => {
  res.json({ success: true, message: "Logged out successfully" })
})

// GET /api/me
router.get("/me", (req, res) => {
  res.json({ success: false, message: "Not authenticated" })
})

module.exports = router
