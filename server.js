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

// MongoDB connection state
let isConnected = false
let connectionPromise = null

const connectDB = async () => {
  // If already connected, return immediately
  if (isConnected) {
    console.log("✅ Already connected to MongoDB")
    return true
  }
  
  // If a connection attempt is in progress, wait for it
  if (connectionPromise) {
    console.log("⏳ Waiting for existing connection attempt...")
    return connectionPromise
  }
  
  const mongoURI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/career_guidance"
  console.log("🔌 Initializing MongoDB connection...")
  console.log("   URI:", mongoURI.replace(/\/\/[^@]*@/, "//***:***@"))
  
  // Start connection attempt
  connectionPromise = new Promise(async (resolve, reject) => {
    try {
      await mongoose.connect(mongoURI, {
        serverSelectionTimeoutMS: 10000,   // 10s
        socketTimeoutMS: 15000,            // 15s
        connectTimeoutMS: 10000,           // 10s
        maxPoolSize: 3,
        minPoolSize: 0,
      })
      
      isConnected = true
      console.log("✅ MongoDB connected successfully")
      resolve(true)
    } catch (err) {
      console.error("❌ MongoDB connection failed:", err.message)
      console.error("   Error details:", {
        code: err.code,
        name: err.name,
        stack: err.stack.substring(0, 200)
      })
      isConnected = false
      connectionPromise = null
      reject(err)
    }
  })
  
  return connectionPromise
}

// Middleware to ensure DB is connected before API requests
app.use("/api", async (req, res, next) => {
  try {
    if (!isConnected) {
      console.log(`[${req.method}] ${req.path} - DB not connected, attempting connection...`)
      
      try {
        await connectDB()
        console.log(`[${req.method}] ${req.path} - DB ready, processing request`)
      } catch (err) {
        console.log(`[${req.method}] ${req.path} - DB connection failed`)
        return res.status(503).json({ 
          success: false,
          error: "Database unavailable",
          message: "Cannot connect to MongoDB. Please try again later." 
        })
      }
    }
    next()
  } catch (err) {
    console.error("Middleware error:", err)
    next(err)
  }
})

// API routes
app.use("/api", authRoutes)

// Error handler - log all errors
app.use((err, req, res, next) => {
  console.error("Unhandled error in request:", {
    url: req.url,
    method: req.method,
    error: err.message,
    stack: err.stack.substring(0, 300)
  })
  
  res.status(500).json({ 
    success: false,
    error: "Internal server error",
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  })
})

module.exports = app

// Development server
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000
  
  // Pre-connect in dev
  connectDB().catch(err => {
    console.error("Failed to connect to MongoDB in dev:", err.message)
  })
  
  app.listen(PORT, () => {
    console.log(`🚀 Dev server: http://localhost:${PORT}`)
  })
}
