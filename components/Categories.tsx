'use client'

import { useState } from 'react'

const categories = [
  { name: 'Pizza', icon: '🍕', color: 'bg-red-100 hover:bg-red-200', count: '120+ restaurants' },
  { name: 'Burger', icon: '🍔', color: 'bg-yellow-100 hover:bg-yellow-200', count: '85+ restaurants' },
  { name: 'Sushi', icon: '🍣', color: 'bg-green-100 hover:bg-green-200', count: '45+ restaurants' },
  { name: 'Chinese', icon: '🥡', color: 'bg-orange-100 hover:bg-orange-200', count: '95+ restaurants' },
  { name: 'Indian', icon: '🍛', color: 'bg-purple-100 hover:bg-purple-200', count: '70+ restaurants' },
  { name: 'Mexican', icon: '🌮', color: 'bg-pink-100 hover:bg-pink-200', count: '55+ restaurants' },
]

export default function Categories() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  return (
    <section className="py-24 bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <div className="inline-flex items-center bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            🍽️ Popular Categories
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">What are you craving?</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">Choose from our most popular food categories and discover amazing restaurants near you</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {categories.map((category, index) => (
            <div
              key={category.name}
              className={`${category.color} p-8 rounded-3xl text-center cursor-pointer transition-all duration-500 transform hover:scale-110 hover:shadow-2xl border-2 border-transparent hover:border-primary/30 group relative overflow-hidden`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className={`text-6xl mb-4 transition-all duration-500 relative z-10 ${hoveredIndex === index ? 'scale-125 rotate-12' : ''}`}>
                {category.icon}
              </div>
              <h3 className="font-bold text-gray-800 mb-2 text-lg relative z-10">{category.name}</h3>
              <p className="text-sm text-gray-600 font-medium relative z-10">{category.count}</p>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-16">
          <button className="group bg-gradient-to-r from-primary to-orange-600 text-white px-10 py-4 rounded-2xl font-semibold hover:from-orange-600 hover:to-primary transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl relative overflow-hidden">
            <span className="relative z-10">View All Categories</span>
            <div className="absolute inset-0 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
          </button>
        </div>
      </div>
    </section>
  )
}