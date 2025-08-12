import Image from 'next/image'
import { Star, Clock, IndianRupee } from 'lucide-react'

const restaurants = [
  {
    id: 1,
    name: 'Spice Garden',
    cuisine: 'North Indian',
    rating: 4.6,
    deliveryTime: '25-35 min',
    deliveryFee: 49,
    image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=60'
  },
  {
    id: 2,
    name: 'Dosa Corner',
    cuisine: 'South Indian',
    rating: 4.4,
    deliveryTime: '20-30 min',
    deliveryFee: 39,
    image: 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=400&h=300&fit=crop'
  },
  {
    id: 3,
    name: 'Biryani Palace',
    cuisine: 'Hyderabadi',
    rating: 4.8,
    deliveryTime: '30-40 min',
    deliveryFee: 59,
    image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400&h=300&fit=crop'
  }
]

export default function FeaturedRestaurants() {
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <div className="inline-flex items-center bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            🎆 Top Rated
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">Featured Restaurants</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">Discover the most popular restaurants in your area with the highest ratings and fastest delivery</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {restaurants.map((restaurant, index) => (
            <div key={restaurant.id} className="group bg-white rounded-3xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100 hover:border-primary/20">
              <div className="relative h-56 overflow-hidden">
                <Image
                  src={restaurant.image}
                  alt={restaurant.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center space-x-1">
                  <Star className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm font-semibold text-gray-800">{restaurant.rating}</span>
                </div>
              </div>
              
              <div className="p-8">
                <h3 className="text-2xl font-bold mb-2 text-gray-900 group-hover:text-primary transition-colors duration-300">{restaurant.name}</h3>
                <p className="text-gray-600 mb-6 font-medium">{restaurant.cuisine} Cuisine</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1 bg-gray-50 px-3 py-2 rounded-lg">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">{restaurant.deliveryTime}</span>
                  </div>
                  
                  <div className="flex items-center space-x-1 bg-green-50 px-3 py-2 rounded-lg">
                    <IndianRupee className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">{restaurant.deliveryFee}</span>
                  </div>
                </div>
                
                <button className="w-full mt-6 bg-primary text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition-colors duration-300 transform hover:scale-105">
                  Order Now
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-16">
          <button className="group bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 px-10 py-4 rounded-2xl font-semibold hover:from-primary hover:to-orange-600 hover:text-white transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
            <span className="relative z-10">View All Restaurants</span>
          </button>
        </div>
      </div>
    </section>
  )
}