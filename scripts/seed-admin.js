// Load environment variables (prefers .env.local if present)
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

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: String,
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  role: { 
    type: String, 
    enum: ['customer', 'restaurant', 'admin', 'delivery'], 
    default: 'customer' 
  },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
})

const User = mongoose.models.User || mongoose.model('User', UserSchema)

async function seedAdmin() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error('[seed-admin] MONGODB_URI is not set. Add it to .env.local or .env before running.')
    process.exit(1)
  }

  const redacted = uri.replace(/:\\?[^:@/]+@/, ':***@')
  console.log('[seed-admin] Connecting to', redacted)

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 })
    console.log('[seed-admin] Connected. DB name:', mongoose.connection.name)

    const adminExists = await User.findOne({ email: 'admin@demo.com' })
    if (adminExists) {
      console.log('[seed-admin] Admin user already exists. Skipping creation.')
      return
    }

    const hashedPassword = await bcrypt.hash('password', 12)
    const admin = new User({
      name: 'Admin User',
      email: 'admin@demo.com',
      password: hashedPassword,
      role: 'admin',
      phone: '+1234567890',
      address: {
        street: '123 Admin St',
        city: 'Admin City',
        state: 'AC',
        zipCode: '12345'
      }
    })

    await admin.save()
    console.log('[seed-admin] Admin user created successfully')
    console.log('[seed-admin] Credentials -> Email: admin@demo.com  Password: password')
  } catch (error) {
    console.error('[seed-admin] Error creating admin user:', error.message)
    if (error.reason) console.error('[seed-admin] Reason:', error.reason)
    process.exitCode = 1
  } finally {
    try {
      await mongoose.disconnect()
      console.log('[seed-admin] Disconnected.')
    } catch {}
  }
}

seedAdmin()