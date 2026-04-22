const express = require("express")
const router = express.Router()
const bcrypt = require("bcryptjs")
const User = require("../models/user")

// POST /api/signup
router.post("/signup", async (req, res) => {
  try {
    console.log("Signup attempt for email:", req.body.email)
    
    const { name, email, password } = req.body
    
    if (!name || !email || !password) {
      console.log("Signup failed: missing fields")
      return res.status(400).json({ 
        success: false, 
        message: "All fields (name, email, password) are required" 
      })
    }

    console.log("Checking for existing user:", email)
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      console.log("Signup failed: email already exists")
      return res.status(400).json({ success: false, message: "Email already registered" })
    }

    console.log("Hashing password...")
    const hash = await bcrypt.hash(password, 10)
    console.log("Password hashed")

    const user = new User({ name, email, password: hash })
    console.log("Saving user...")
    await user.save()
    console.log("User saved successfully")

    res.json({ success: true, message: "Signup successful" })
    
  } catch (err) {
    console.error("Signup error:", err)
    console.error("Error stack:", err.stack)
    
    // Check for validation errors
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        message: "Validation error: " + err.message 
      })
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Server error during signup",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    })
  }
})

// POST /api/login
router.post("/login", async (req, res) => {
  try {
    console.log("Login attempt for email:", req.body.email)
    
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password required" })
    }

    console.log("Finding user...")
    const user = await User.findOne({ email })
    if (!user) {
      console.log("Login failed: user not found")
      return res.status(401).json({ success: false, message: "User not found" })
    }

    console.log("Comparing password...")
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      console.log("Login failed: wrong password")
      return res.status(401).json({ success: false, message: "Wrong password" })
    }

    console.log("Login successful for:", user.name)
    res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    })

  } catch (err) {
    console.error("Login error:", err)
    res.status(500).json({ 
      success: false, 
      message: "Server error during login",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    })
  }
})

// POST /api/logout
router.post("/logout", (req, res) => {
  res.json({ success: true, message: "Logged out successfully" })
})

// GET /api/me
router.get("/me", (req, res) => {
  res.json({ success: false, message: "Not authenticated" })
})

module.exports = router
