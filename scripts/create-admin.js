const bcrypt = require('bcryptjs')
const mongoose = require('mongoose')

// User Schema (simplified)
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
}, {
  timestamps: true
})

const User = mongoose.models.User || mongoose.model('User', UserSchema)

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/fooddelivery')
    console.log('Connected to MongoDB')

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@demo.com' })
    if (existingAdmin) {
      console.log('Admin user already exists')
      process.exit(0)
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('password', 12)

    // Create admin user
    const admin = new User({
      name: 'Admin User',
      email: 'admin@demo.com',
      password: hashedPassword,
      role: 'admin'
    })

    await admin.save()
    console.log('Admin user created successfully!')
    console.log('Email: admin@demo.com')
    console.log('Password: password')

  } catch (error) {
    console.error('Error creating admin:', error)
  } finally {
    await mongoose.disconnect()
    process.exit(0)
  }
}

createAdmin()