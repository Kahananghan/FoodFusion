// Load environment variables (.env.local preferred)
try {
  const fs = require('fs')
  if (fs.existsSync('.env.local')) {
    require('dotenv').config({ path: '.env.local' })
  } else if (fs.existsSync('.env')) {
    require('dotenv').config()
  }
} catch {}

const bcrypt = require('bcryptjs')
const mongoose = require('mongoose')

// Minimal user schema (kept local to avoid ts-node / module import issues)
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: String,
  role: {
    type: String,
    enum: ['customer', 'restaurant', 'admin', 'delivery'],
    default: 'customer'
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true })

const User = mongoose.models.User || mongoose.model('User', UserSchema)

async function createAdmin() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error('[create-admin] MONGODB_URI not set. Add it to .env.local')
    process.exit(1)
  }

  const redacted = uri.replace(/:\\?[^:@/]+@/, ':***@')
  console.log('[create-admin] Connecting to', redacted)

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 })
    console.log('[create-admin] Connected. DB:', mongoose.connection.name)

    const email = 'admin@demo.com'
    const existingAdmin = await User.findOne({ email })
    if (existingAdmin) {
      console.log('[create-admin] Admin already exists. Skipping.')
      return
    }

    const passwordPlain = 'password'
    const hashedPassword = await bcrypt.hash(passwordPlain, 12)

    await User.create({
      name: 'Admin User',
      email,
      password: hashedPassword,
      role: 'admin'
    })

    console.log('[create-admin] Admin user created successfully')
    console.log('[create-admin] Credentials -> Email:', email, 'Password:', passwordPlain)
  } catch (err) {
    console.error('[create-admin] Error:', err.message)
    process.exitCode = 1
  } finally {
    try { await mongoose.disconnect() } catch {}
    console.log('[create-admin] Disconnected.')
  }
}

createAdmin()