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

// MongoDB connection state
let dbReady = false

const connectDB = async () => {
  if (dbReady) return true
  
  const mongoURI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/career_guidance"
  console.log("🔌 Connecting to MongoDB...")
  console.log("   URI (masked):", mongoURI.replace(/\/\/[^@]*@/, "//***:***@"))
  
  try {
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,   // 10s
      socketTimeoutMS: 15000,            // 15s
      connectTimeoutMS: 10000,           // 10s
      maxPoolSize: 3,
      minPoolSize: 0,
    })
    dbReady = true
    console.log("✅ MongoDB connected")
    return true
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message)
    console.error("   Full error:", err)
    
    if (err.message.includes('Authentication failed')) {
      console.error("   → AUTH FAILED: Check username/password in connection string")
    } else if (err.message.includes('ENOTFOUND')) {
      console.error("   → DNS ERROR: Check cluster hostname")
    } else if (err.message.includes('ETIMEDOUT') || err.message.includes('timed out')) {
      console.error("   → TIMEOUT: Cluster may be unreachable (check IP whitelist)")
    }
    
    return false
  }
}

// Ensure DB is ready BEFORE handling API requests
app.use("/api", async (req, res, next) => {
  if (!dbReady) {
    console.log("DB not ready, connecting now...")
    const connected = await connectDB()
    if (!connected) {
      console.log("DB connection FAILED - returning 503")
      return res.status(503).json({ 
        success: false,
        error: "Database connection failed",
        message: "Cannot connect to MongoDB. Please check server logs for details." 
      })
    }
    console.log("DB connected, proceeding with request")
  }
  next()
})

// API routes (after DB middleware)
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

// Error handler - expose errors in dev
app.use((err, req, res, next) => {
  console.error("Unhandled error:", {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  })
  
  res.status(500).json({ 
    success: false,
    error: "Internal server error",
    message: process.env.NODE_ENV === 'development' ? err.message : "Please try again later"
  })
})

module.exports = app

// Development server
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000
  
  // Connect DB on dev startup
  connectDB().catch(err => {
    console.error("Failed to connect to MongoDB:", err.message)
  })
  
  app.listen(PORT, () => {
    console.log(`🚀 Dev: http://localhost:${PORT}`)
  })
}
