const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")

const authRoutes = require("./routes/auth")

const app = express()

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// API routes
app.use("/api", authRoutes)

// MongoDB connection state
let dbReady = false

const connectDB = async () => {
  if (dbReady) return true

  const mongoURI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/career_guidance"

  try {
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 30000, // 30s
      socketTimeoutMS: 60000, // 60s
      // Keep alive for serverless reuse
      keepAlive: true,
      keepAliveInitialDelay: 300000,
    })
    dbReady = true
    console.log("✅ MongoDB connected")
    return true
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message)
    dbReady = false
    return false
  }
}

// Middleware to ensure DB connection before API requests
app.use("/api", async (req, res, next) => {
  if (!dbReady) {
    const connected = await connectDB()
    if (!connected) {
      return res.status(503).json({
        error: "Database unavailable",
        message: "Please try again later"
      })
    }
  }
  next()
})

// Error handling middleware (must be after routes)
app.use((err, req, res, next) => {
  console.error("🚨 API Error:", err.stack)
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  })
})

// Export for Vercel
module.exports = app

// Development server only
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000

  // Serve static files
  app.use(express.static("public"))

  // Clean URL support for dev
  app.get("/:page", (req, res, next) => {
    const page = req.params.page
    if (!page.includes('.')) {
      res.sendFile(__dirname + "/public/" + page + ".html", (err) => {
        if (err) next()
      })
    } else {
      next()
    }
  })

  // Connect DB in dev
  connectDB().catch(console.error)

  app.listen(PORT, () => {
    console.log(`🖥️  Dev server: http://localhost:${PORT}`)
  })
}
