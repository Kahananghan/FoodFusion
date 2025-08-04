const mongoose = require('mongoose')

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
    zipCode: { type: String, required: true }
  },
  menu: [],
  isOpen: { type: Boolean, default: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
})

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['customer', 'restaurant', 'admin', 'delivery'], default: 'customer' }
})

const Restaurant = mongoose.models.Restaurant || mongoose.model('Restaurant', RestaurantSchema)
const User = mongoose.models.User || mongoose.model('User', UserSchema)

const sampleRestaurants = [
  // Mumbai Restaurants
  {
    name: "Trishna",
    description: "Contemporary Indian seafood with coastal flavors",
    image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500&h=300&fit=crop",
    cuisine: ["Indian", "Seafood"],
    rating: 4.6,
    deliveryTime: "35-45 min",
    deliveryFee: 49,
    minimumOrder: 300,
    address: {
      street: "7, Sai Baba Marg, Fort",
      city: "Mumbai",
      state: "Maharashtra",
      zipCode: "400001"
    },
    isOpen: true,
    status: "approved"
  },
  {
    name: "Leopold Cafe",
    description: "Iconic Mumbai cafe serving continental and Indian dishes",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&h=300&fit=crop",
    cuisine: ["Continental", "Indian"],
    rating: 4.2,
    deliveryTime: "25-35 min",
    deliveryFee: 39,
    minimumOrder: 250,
    address: {
      street: "SB Marg, Colaba Causeway",
      city: "Mumbai",
      state: "Maharashtra",
      zipCode: "400005"
    },
    isOpen: true,
    status: "approved"
  },
  // Delhi Restaurants
  {
    name: "Karim's",
    description: "Legendary Mughlai cuisine since 1913",
    image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500&h=300&fit=crop",
    cuisine: ["Mughlai", "Non-Veg"],
    rating: 4.5,
    deliveryTime: "30-40 min",
    deliveryFee: 29,
    minimumOrder: 200,
    address: {
      street: "16, Gali Kababian, Jama Masjid",
      city: "Delhi",
      state: "Delhi",
      zipCode: "110006"
    },
    isOpen: true,
    status: "approved"
  },
  {
    name: "Paranthe Wali Gali",
    description: "Famous for stuffed paranthas and traditional Indian breakfast",
    image: "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=500&h=300&fit=crop",
    cuisine: ["North Indian", "Street Food"],
    rating: 4.3,
    deliveryTime: "20-30 min",
    deliveryFee: 25,
    minimumOrder: 150,
    address: {
      street: "Paranthe Wali Gali, Chandni Chowk",
      city: "Delhi",
      state: "Delhi",
      zipCode: "110006"
    },
    isOpen: true,
    status: "approved"
  },
  // Bangalore Restaurants
  {
    name: "MTR",
    description: "Authentic South Indian breakfast and meals since 1924",
    image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&h=300&fit=crop",
    cuisine: ["South Indian", "Vegetarian"],
    rating: 4.7,
    deliveryTime: "25-35 min",
    deliveryFee: 35,
    minimumOrder: 180,
    address: {
      street: "14, Lalbagh Road",
      city: "Bangalore",
      state: "Karnataka",
      zipCode: "560027"
    },
    isOpen: true,
    status: "approved"
  },
  {
    name: "Vidyarthi Bhavan",
    description: "Famous for crispy dosas and filter coffee",
    image: "https://images.unsplash.com/photo-1630383249896-424e482df921?w=500&h=300&fit=crop",
    cuisine: ["South Indian", "Breakfast"],
    rating: 4.4,
    deliveryTime: "20-30 min",
    deliveryFee: 30,
    minimumOrder: 120,
    address: {
      street: "32, Gandhi Bazaar Main Road",
      city: "Bangalore",
      state: "Karnataka",
      zipCode: "560004"
    },
    isOpen: true,
    status: "approved"
  },
  // Chennai Restaurants
  {
    name: "Murugan Idli Shop",
    description: "Soft idlis with variety of chutneys and sambar",
    image: "https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=500&h=300&fit=crop",
    cuisine: ["South Indian", "Vegetarian"],
    rating: 4.5,
    deliveryTime: "15-25 min",
    deliveryFee: 25,
    minimumOrder: 100,
    address: {
      street: "1/1, GN Chetty Road, T Nagar",
      city: "Chennai",
      state: "Tamil Nadu",
      zipCode: "600017"
    },
    isOpen: true,
    status: "approved"
  },
  {
    name: "Dakshin",
    description: "Fine dining South Indian cuisine with authentic flavors",
    image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500&h=300&fit=crop",
    cuisine: ["South Indian", "Fine Dining"],
    rating: 4.6,
    deliveryTime: "40-50 min",
    deliveryFee: 59,
    minimumOrder: 400,
    address: {
      street: "Sheraton Grand Chennai Resort",
      city: "Chennai",
      state: "Tamil Nadu",
      zipCode: "600119"
    },
    isOpen: true,
    status: "approved"
  },
  // Kolkata Restaurants
  {
    name: "Peter Cat",
    description: "Famous for Chelo Kebab and continental cuisine",
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&h=300&fit=crop",
    cuisine: ["Continental", "Kebab"],
    rating: 4.4,
    deliveryTime: "35-45 min",
    deliveryFee: 45,
    minimumOrder: 350,
    address: {
      street: "18A, Park Street",
      city: "Kolkata",
      state: "West Bengal",
      zipCode: "700016"
    },
    isOpen: true,
    status: "approved"
  },
  {
    name: "Flurys",
    description: "Iconic tearoom serving pastries and continental breakfast",
    image: "https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=500&h=300&fit=crop",
    cuisine: ["Continental", "Bakery"],
    rating: 4.3,
    deliveryTime: "25-35 min",
    deliveryFee: 40,
    minimumOrder: 200,
    address: {
      street: "18, Park Street",
      city: "Kolkata",
      state: "West Bengal",
      zipCode: "700016"
    },
    isOpen: true,
    status: "approved"
  },
  // Hyderabad Restaurants
  {
    name: "Paradise Biryani",
    description: "World famous Hyderabadi biryani and kebabs",
    image: "https://images.unsplash.com/photo-1563379091339-03246963d96c?w=500&h=300&fit=crop",
    cuisine: ["Hyderabadi", "Biryani"],
    rating: 4.5,
    deliveryTime: "30-40 min",
    deliveryFee: 35,
    minimumOrder: 250,
    address: {
      street: "Opposite Secunderabad Club",
      city: "Hyderabad",
      state: "Telangana",
      zipCode: "500003"
    },
    isOpen: true,
    status: "approved"
  },
  {
    name: "Shah Ghouse",
    description: "Authentic Hyderabadi cuisine and haleem",
    image: "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=500&h=300&fit=crop",
    cuisine: ["Hyderabadi", "Haleem"],
    rating: 4.4,
    deliveryTime: "25-35 min",
    deliveryFee: 30,
    minimumOrder: 200,
    address: {
      street: "Tolichowki Main Road",
      city: "Hyderabad",
      state: "Telangana",
      zipCode: "500008"
    },
    isOpen: true,
    status: "approved"
  }
]

async function seedRestaurants() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fooddelivery')
    
    // Clear existing restaurants to reseed with new data
    await Restaurant.deleteMany({})
    console.log('Cleared existing restaurants')

    // Create a default restaurant owner user
    let owner = await User.findOne({ email: 'restaurant@demo.com' })
    if (!owner) {
      const bcrypt = require('bcryptjs')
      const hashedPassword = await bcrypt.hash('password', 12)
      
      owner = new User({
        name: 'Restaurant Owner',
        email: 'restaurant@demo.com',
        password: hashedPassword,
        role: 'restaurant'
      })
      await owner.save()
      console.log('Created restaurant owner user')
    }

    // Add owner ID to each restaurant
    const restaurantsWithOwner = sampleRestaurants.map(restaurant => ({
      ...restaurant,
      owner: owner._id
    }))

    // Insert restaurants
    await Restaurant.insertMany(restaurantsWithOwner)
    console.log(`Successfully seeded ${sampleRestaurants.length} restaurants`)
    
  } catch (error) {
    console.error('Error seeding restaurants:', error)
  } finally {
    await mongoose.disconnect()
  }
}

seedRestaurants()