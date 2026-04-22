const express = require("express")
const mongoose = require("mongoose")
const bodyParser = require("body-parser")
const cors = require("cors")

const authRoutes = require("./routes/auth")

const app = express()

app.use(cors())
app.use(bodyParser.json())
app.use(express.static("public"))
app.use(express.urlencoded({extended:true}))

// MongoDB connection with options for Vercel/reconnection handling
const mongoURI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/career_guidance"

const connectDB = async () => {
  try {
    await mongoose.connect(mongoURI, {
      // These options help with serverless/reconnection scenarios
    })
    console.log("Connected to MongoDB")
  } catch (err) {
    console.error("MongoDB connection error:", err)
    // Retry connection after 3 seconds if in production
    if (process.env.NODE_ENV === 'production') {
      setTimeout(connectDB, 3000)
    }
  }
}

connectDB()

// Handle mongoose connection events
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected')
  if (process.env.NODE_ENV === 'production') {
    setTimeout(connectDB, 3000)
  }
})

app.use("/api",authRoutes)

// Export for Vercel serverless
module.exports = app

// Start server only if not in Vercel (local development)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    const PORT = process.env.PORT || 3000
    app.listen(PORT,()=>{
        console.log(`Server running on port ${PORT}`)
    })
}
