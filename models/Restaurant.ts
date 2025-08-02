import mongoose from 'mongoose'

const MenuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  category: { type: String, required: true },
  isVegetarian: { type: Boolean, default: false },
  isAvailable: { type: Boolean, default: true }
})

const RestaurantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  cuisine: [{ type: String, required: true }],
  rating: { type: Number, default: 0 },
  deliveryTime: { type: String, required: true },
  deliveryFee: { type: Number, required: true },
  minimumOrder: { type: Number, required: true },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  menu: [MenuItemSchema],
  isOpen: { type: Boolean, default: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
})

export default mongoose.models.Restaurant || mongoose.model('Restaurant', RestaurantSchema)