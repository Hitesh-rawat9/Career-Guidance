const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const authRoutes = require("./routes/auth")
const path = require("path")

const app = express()

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve static files
app.use(express.static(path.join(__dirname, "public")))

// API routes
app.use("/api", authRoutes)

// Root route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"))
})

// Clean URL routes
app.get("/:page", (req, res) => {
  const page = req.params.page
  if (page.includes('.')) {
    return res.status(404).send('Not found')
  }
  res.sendFile(path.join(__dirname, "public", page + ".html"), (err) => {
    if (err) res.status(404).send('Page not found')
  })
})

// MongoDB connection
const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/career_guidance"
  
  console.log(" MongoDB connecting...")
  
  try {
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 60000,
      connectTimeoutMS: 30000,
    })
    console.log("✅ MongoDB connected")
    return true
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message)
    console.error("   Full error:", err)
    return false
  }
}

// Connect immediately on cold start (not lazy)
let dbReady = false

// Wrap all API routes with DB check
app.use("/api", async (req, res, next) => {
  if (!dbReady) {
    console.log("DB not ready, attempting connection...")
    dbReady = await connectDB()
    if (!dbReady) {
      console.log("DB connection failed - returning 503")
      return res.status(503).json({ 
        error: "Database connection failed",
        message: "Please try again later. If problem persists, contact support."
      })
    }
  }
  next()
})

// Error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err)
  res.status(500).json({ error: "Internal server error" })
})

module.exports = app

// Development server
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000
  
  // Connect DB in dev
  connectDB()
  
  app.listen(PORT, () => {
    console.log(`🚀 Dev: http://localhost:${PORT}`)
  })
}
