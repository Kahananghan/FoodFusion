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
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fooddelivery')
    
    const adminExists = await User.findOne({ email: 'admin@demo.com' })
    if (adminExists) {
      console.log('Admin user already exists')
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
    console.log('Admin user created successfully')
    console.log('Email: admin@demo.com')
    console.log('Password: password')
    
  } catch (error) {
    console.error('Error creating admin user:', error)
  } finally {
    await mongoose.disconnect()
  }
}

seedAdmin()