const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")

const authRoutes = require("./routes/auth")

const app = express()

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended:true}))

// API routes
app.use("/api", authRoutes)

// MongoDB - lazy connection for serverless
let dbReady = false

const connectDB = async () => {
  if (dbReady) return
  
  const mongoURI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/career_guidance"
  
  try {
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    })
    dbReady = true
    console.log("MongoDB connected")
  } catch (err) {
    console.error("MongoDB error:", err.message)
    dbReady = false
    throw err
  }
}

// Ensure DB before API requests
app.use("/api", async (req, res, next) => {
  if (!dbReady) {
    try {
      await connectDB()
    } catch (err) {
      return res.status(500).json({ error: "Database unavailable" })
    }
  }
  next()
})

module.exports = app

// Development server only
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000
  
  // Static files
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
  
  // Connect DB
  connectDB().catch(console.error)
  
  app.listen(PORT, () => {
    console.log(`Dev server: http://localhost:${PORT}`)
  })
}
