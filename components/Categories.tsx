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
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">What are you craving?</h2>
          <p className="text-xl text-gray-600">Choose from our most popular food categories</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {categories.map((category, index) => (
            <div
              key={category.name}
              className={`${category.color} p-6 rounded-2xl text-center cursor-pointer transition-all duration-300 transform hover:scale-110 hover:shadow-xl border-2 border-transparent hover:border-primary/20`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className={`text-5xl mb-3 transition-transform duration-300 ${hoveredIndex === index ? 'scale-125' : ''}`}>
                {category.icon}
              </div>
              <h3 className="font-bold text-gray-800 mb-1">{category.name}</h3>
              <p className="text-xs text-gray-600">{category.count}</p>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <button className="bg-primary text-white px-8 py-3 rounded-xl font-semibold hover:bg-orange-600 transition-colors duration-300">
            View All Categories
          </button>
        </div>
      </div>
    </section>
  )
}