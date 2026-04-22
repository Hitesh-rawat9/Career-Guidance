const mongoose = require("mongoose")

const uri = process.env.MONGODB_URI || "mongodb+srv://hitesh:%25Gq8JY-U3pA7qz_@cluster0.sipfywq.mongodb.net/career_guidance?retryWrites=true&w=majority&appName=Cluster0"

console.log("Testing connection to:", uri.replace(/\/\/.*@/, "//***:***@"))

mongoose.connect(uri, {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 10000,
})
.then(() => {
  console.log("✅ Connected successfully!")
  process.exit(0)
})
.catch(err => {
  console.error("❌ Connection failed:")
  console.error("Message:", err.message)
  console.error("Code:", err.code)
  console.error("Name:", err.name)
  process.exit(1)
})
