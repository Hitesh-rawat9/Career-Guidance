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

// MongoDB - use global cached connection
let cachedConnection = null

const connectDB = async () => {
  // Return existing connection if already connected
  if (cachedConnection && mongoose.connection.readyState === 1) {
    console.log("✅ Using existing DB connection")
    return true
  }
  
  const mongoURI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/career_guidance"
  console.log("🔌 New DB connection attempt...")
  
  try {
    // Close any existing stale connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close()
    }
    
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,   // 10s to find server
      socketTimeoutMS: 15000,            // 15s socket timeout
      connectTimeoutMS: 10000,           // 10s connect timeout
      maxPoolSize: 3,                    // Small pool for serverless
      minPoolSize: 0,                    // Release connections when idle
    })
    
    cachedConnection = mongoose.connection
    console.log("✅ MongoDB connected successfully")
    return true
    
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message)
    
    // More helpful error messages
    if (err.message.includes('ENOTFOUND') || err.message.includes('getaddrinfo')) {
      console.error("   → DNS resolution failed. Check:")
      console.error("     - Connection string hostname is correct")
      console.error("     - Internet connectivity")
    } else if (err.message.includes('ECONNREFUSED')) {
      console.error("   → Connection refused. Check:")
      console.error("     - MongoDB Atlas cluster is running")
      console.error("     - IP whitelist includes Vercel IPs (0.0.0.0/0)")
    } else if (err.message.includes('Authentication failed')) {
      console.error("   → Authentication failed. Check:")
      console.error("     - Username/password in connection string")
      console.error("     - Database user has readWrite role")
    } else if (err.message.includes('timed out') || err.message.includes('ETIMEDOUT')) {
      console.error("   → Connection timed out. Check:")
      console.error("     - Atlas cluster is in a region near Vercel")
      console.error("     - IP whitelist (0.0.0.0/0)")
      console.error("     - Cluster is not paused")
    }
    
    return false
  }
}

// Lazy connect on first API request (with retry)
let dbRetryCount = 0
const maxRetries = 2

app.use("/api", async (req, res, next) => {
  if (!cachedConnection || mongoose.connection.readyState !== 1) {
    console.log(`[${req.method}] ${req.path} - DB not connected, connecting...`)
    
    const success = await connectDB()
    
    if (!success && dbRetryCount < maxRetries) {
      dbRetryCount++
      console.log(`Retrying DB connection (${dbRetryCount}/${maxRetries})...`)
      // Quick retry
      setTimeout(async () => {
        const retrySuccess = await connectDB()
        if (retrySuccess) {
          dbRetryCount = 0
          return next()
        }
      }, 1000)
      return res.status(503).json({ 
        error: "Database unavailable",
        message: "Connection attempt failed, retrying..." 
      })
    }
    
    if (!success) {
      return res.status(503).json({ 
        error: "Database unavailable",
        message: "Cannot connect to MongoDB. Check Vercel logs for details." 
      })
    }
    
    dbRetryCount = 0
  }
  next()
})

// Error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  })
  
  res.status(500).json({ 
    error: "Internal server error",
    ...(process.env.NODE_ENV === 'development' && { details: err.message })
  })
})

module.exports = app

// Development server
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000
  
  // Connect DB in dev
  connectDB().catch(console.error)
  
  app.listen(PORT, () => {
    console.log(`🚀 Dev server: http://localhost:${PORT}`)
    console.log(`📁 Serving files from: ${path.join(__dirname, "public")}`)
  })
}