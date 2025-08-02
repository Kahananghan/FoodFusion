'use client'

import Link from 'next/link'
import { ArrowRight, Play } from 'lucide-react'
import { useState } from 'react'

export default function Hero() {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              🎉 Free delivery on orders over $30
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Craving?
              <span className="text-primary block">We Deliver!</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-lg mx-auto lg:mx-0">
              Get your favorite meals delivered hot and fresh from top restaurants in your area. Fast, reliable, delicious.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link 
                href="/restaurants" 
                className="group bg-primary text-white px-8 py-4 rounded-xl font-semibold hover:bg-orange-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                Order Now
                <ArrowRight className={`ml-2 h-5 w-5 transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} />
              </Link>
              
              <button className="group border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl font-semibold hover:border-primary hover:text-primary transition-all duration-300 flex items-center justify-center">
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
              </button>
            </div>
            
            <div className="flex items-center justify-center lg:justify-start mt-8 space-x-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">10k+</div>
                <div className="text-sm text-gray-600">Happy Customers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">500+</div>
                <div className="text-sm text-gray-600">Restaurants</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">30min</div>
                <div className="text-sm text-gray-600">Avg Delivery</div>
              </div>
            </div>
          </div>
          
          {/* Right Content - Food Image */}
          <div className="relative">
            <div className="relative z-10">
              <div className="bg-white rounded-3xl shadow-2xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="w-full h-96 bg-gradient-to-br from-orange-100 to-red-100 rounded-2xl flex items-center justify-center">
                  <div className="text-8xl">🍕</div>
                </div>
              </div>
            </div>
            
            {/* Floating Cards */}
            <div className="absolute -top-4 -left-4 bg-white rounded-xl shadow-lg p-4 animate-bounce">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  ⭐
                </div>
                <div>
                  <div className="text-sm font-semibold">4.9 Rating</div>
                  <div className="text-xs text-gray-500">2k+ Reviews</div>
                </div>
              </div>
            </div>
            
            <div className="absolute -bottom-4 -right-4 bg-white rounded-xl shadow-lg p-4 animate-bounce delay-500">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm">
                  🚚
                </div>
                <div>
                  <div className="text-sm font-semibold">Fast Delivery</div>
                  <div className="text-xs text-gray-500">25-30 min</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}