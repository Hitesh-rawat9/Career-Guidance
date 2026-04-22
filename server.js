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

// Clean URL routes for HTML pages
app.get("/:page", (req, res) => {
  const page = req.params.page
  if (page.includes('.')) {
    return res.status(404).send('Not found')
  }
  res.sendFile(path.join(__dirname, "public", page + ".html"), (err) => {
    if (err) res.status(404).send('Page not found')
  })
})

// MongoDB connection with better error handling
let dbReady = false

const connectDB = async () => {
  if (dbReady) return true

  const mongoURI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/career_guidance"
  
  console.log("Connecting to MongoDB...")
  
  try {
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 60000,
    })
    dbReady = true
    console.log("✅ MongoDB connected")
    return true
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message)
    console.error("Error code:", err.code)
    console.error("Error name:", err.name)
    
    // Specific error messages
    if (err.name === 'MongoServerSelectionError') {
      console.error("→ Cannot reach MongoDB server. Check:")
      console.error("  - Network connectivity")
      console.error("  - MongoDB Atlas IP whitelist (should include 0.0.0.0/0)")
      console.error("  - Cluster is running")
    } else if (err.message.includes('Authentication failed')) {
      console.error("→ Authentication failed. Check:")
      console.error("  - Username/password in connection string")
      console.error("  - Database user has correct permissions")
    }
    
    dbReady = false
    return false
  }
}

// Middleware to ensure DB before API requests
app.use("/api", async (req, res, next) => {
  if (!dbReady) {
    console.log(`[${req.method}] ${req.path} - DB not ready, connecting...`)
    const connected = await connectDB()
    if (!connected) {
      console.log(`[${req.method}] ${req.path} - DB connection failed`)
      return res.status(503).json({ 
        error: "Database connection failed",
        message: "Unable to connect to MongoDB. Please try again later." 
      })
    }
    console.log(`[${req.method}] ${req.path} - DB connected, proceeding`)
  }
  next()
})

// Request logging for debugging
app.use("/api", (req, res, next) => {
  console.log(`[${req.method}] ${req.path}`)
  next()
})

// Error handler
app.use((err, req, res, next) => {
  console.error("API Error:", {
    stack: err.stack,
    message: err.message,
    url: req.url,
    method: req.method
  })
  
  // Don't expose internal errors in production
  const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === 'development'
  
  res.status(500).json({ 
    error: "Internal server error",
    message: isDev ? err.message : undefined
  })
})

module.exports = app

// Development server
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000
  
  // Connect DB on startup in dev
  connectDB().catch(err => {
    console.error("Failed to connect to MongoDB in dev:", err.message)
  })
  
  app.listen(PORT, () => {
    console.log(`🚀 Dev server running on http://localhost:${PORT}`)
    console.log(`📁 Serving static files from: ${path.join(__dirname, "public")}`)
  })
}
