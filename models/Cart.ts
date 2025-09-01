import mongoose, { Document, Model } from 'mongoose'

interface ICart extends Document {
  name: string
  price: number
  quantity: number
  image?: string
  restaurant: string
  userId?: string
}

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

// Ensure a properly typed model is exported to avoid TypeScript union-callable issues
const Cart = (mongoose.models.Cart as Model<ICart>) || mongoose.model<ICart>('Cart', CartSchema)

export default Cart