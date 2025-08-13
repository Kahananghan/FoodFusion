import mongoose from 'mongoose'

const OrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  restaurant: { type: String, required: true },
  items: [{
    menuItem: {
      name: String,
      price: Number,
      image: String
    },
    quantity: { type: Number, required: true }
  }],
  totalAmount: { type: Number, required: true },
  deliveryAddress: {
    name: String,
    phone: String,
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    landmark: String,
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'out-for-delivery', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  deliveryPersonId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deliveryFee: { type: Number, default: 5 },
  estimatedDeliveryTime: Date
}, {
  timestamps: true
})

export default mongoose.models.Order || mongoose.model('Order', OrderSchema)