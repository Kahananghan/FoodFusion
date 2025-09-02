import mongoose from 'mongoose'

const AddressSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  landmark: String,
  type: { type: String, enum: ['home', 'office', 'other'], default: 'home' },
  coordinates: {
    lat: Number,
    lng: Number
  }
}, { timestamps: true })

const CartItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, default: 1 },
  image: { type: String, default: '' },
  restaurant: { type: String, required: true }
}, { timestamps: true })

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: String,
  addresses: [AddressSchema],
  // Embedded cart items (moved from separate Cart model into User)
  cart: { type: [CartItemSchema], default: [] },
  role: { 
    type: String, 
    enum: ['customer', 'restaurant', 'admin', 'delivery'], 
    default: 'customer' 
  },
  isActive: { type: Boolean, default: true },
  
  // Delivery partner specific fields
  status: {
    type: String,
    enum: ['available', 'busy', 'offline'],
    default: 'offline'
  },
  rating: { type: Number, default: 0 },
  totalDeliveries: { type: Number, default: 0 },
  earnings: { type: Number, default: 0 },
  location: {
    lat: Number,
    lng: Number
  },
  lastLogin: Date,
  totalOrders: { type: Number, default: 0 }
}, {
  timestamps: true
})

export default mongoose.models.User || mongoose.model('User', UserSchema)