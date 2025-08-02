import mongoose from 'mongoose'

const AddressSchema = new mongoose.Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  coordinates: {
    lat: Number,
    lng: Number
  }
})

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: String,
  address: AddressSchema,
  role: { 
    type: String, 
    enum: ['customer', 'restaurant', 'admin'], 
    default: 'customer' 
  }
}, {
  timestamps: true
})

export default mongoose.models.User || mongoose.model('User', UserSchema)