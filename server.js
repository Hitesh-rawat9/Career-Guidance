const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")

const authRoutes = require("./routes/auth")

const app = express()

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// API routes (must come BEFORE static to avoid conflicts)
app.use("/api", authRoutes)

// MongoDB
let dbReady = false
const connectDB = async () => {
  if (dbReady) return true
  const mongoURI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/career_guidance"
  try {
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 60000,
    })
    dbReady = true
    console.log("✅ MongoDB connected")
    return true
  } catch (err) {
    console.error("❌ MongoDB error:", err.message)
    return false
  }
}

// DB middleware for API
app.use("/api", async (req, res, next) => {
  if (!dbReady) {
    const ok = await connectDB()
    if (!ok) return res.status(503).json({ error: "Database unavailable" })
  }
  next()
})

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err.stack)
  res.status(500).json({ error: "Internal server error" })
})

module.exports = app

// Development server
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000
  
  // Static files
  app.use(express.static("public"))
  
  // Root
  app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html")
  })
  
  // Clean URLs for HTML pages
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
  
  connectDB().catch(console.error)
  
  app.listen(PORT, () => {
    console.log(`Dev: http://localhost:${PORT}`)
  })
}
