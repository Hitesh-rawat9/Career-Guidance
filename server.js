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

// MongoDB connection - deferred in serverless
const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/career_guidance"
  
  try {
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    })
    console.log("Connected to MongoDB")
    return true
  } catch (err) {
    console.error("MongoDB connection error:", err.message)
    return false
  }
}

// Connect immediately in all environments
connectDB()

// Handle disconnection
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected')
})

// Export for Vercel
module.exports = app

// Local development server
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const PORT = process.env.PORT || 3000
  
  // Serve static files
  app.use(express.static("public"))
  
  // HTML pages
  app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html")
  })
  
  app.get("/:page", (req, res) => {
    const page = req.params.page
    if (page.includes('.')) return res.status(404).send('Not found')
    res.sendFile(__dirname + "/public/" + page + ".html", (err) => {
      if (err) res.status(404).send('Not found')
    })
  })
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}
