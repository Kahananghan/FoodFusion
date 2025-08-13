import mongoose from 'mongoose'

const CartSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 1
  },
  image: {
    type: String,
    default: ''
  },
  restaurant: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    default: 'guest'
  }
}, {
  timestamps: true
})

export default mongoose.models.Cart || mongoose.model('Cart', CartSchema)