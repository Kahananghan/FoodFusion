'use client'

import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

export default function Hero() {
  const [isHovered, setIsHovered] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-orange-100 via-white to-red-100 overflow-hidden">
      {/* Enhanced Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary/5 to-transparent rounded-full"></div>
      </div>
      
      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 animate-float">
          <Sparkles className="w-6 h-6 text-primary/30" />
        </div>
        <div className="absolute top-3/4 right-1/4 animate-float delay-1000">
          <Sparkles className="w-4 h-4 text-orange-400/40" />
        </div>
        <div className="absolute top-1/2 right-1/3 animate-float delay-500">
          <Sparkles className="w-5 h-5 text-red-400/30" />
        </div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            <div className={`inline-flex items-center bg-primary/10 text-primary px-6 py-3 rounded-full text-sm font-medium mb-8 transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
              <span className="animate-bounce mr-2">🚚</span>
              Free delivery on orders over ₹500 • 30min or less
              <span className="ml-2 bg-primary text-white text-xs px-2 py-1 rounded-full">FAST</span>
            </div>
            
            <h1 className={`text-5xl lg:text-5xl font-bold text-gray-900 mb-8 leading-tight transform transition-all duration-1000 delay-200 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
              <span className="block mb-4">Your Favourite Food</span>
              <span className="block bg-gradient-to-r from-primary to-orange-600 bg-clip-text text-transparent">
                Delivered Fast
              </span>
            </h1>
            
            <p className={`text-xl text-gray-600 mb-10 max-w-lg mx-auto lg:mx-0 leading-relaxed transform transition-all duration-1000 delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
              Order from <span className="font-semibold text-gray-800">50+ restaurants</span> near you. Hot, fresh meals delivered to your doorstep in 30 minutes or less.
            </p>
            
            <div className={`flex flex-col sm:flex-row gap-4 justify-center lg:justify-start transform transition-all duration-1000 delay-400 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
              <Link 
                href="/restaurants" 
                className="group bg-gradient-to-r from-primary to-orange-600 text-white px-10 py-4 rounded-2xl font-semibold hover:from-orange-600 hover:to-primary transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-2xl flex items-center justify-center relative overflow-hidden"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                <span className="relative z-10">Order Now</span>
                <ArrowRight className={`ml-2 h-5 w-5 transition-transform duration-300 relative z-10 ${isHovered ? 'translate-x-1' : ''}`} />
                <div className="absolute inset-0 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              </Link>
              
              <Link 
                href="/restaurants" 
                className="group border-2 border-gray-300 text-gray-700 px-10 py-4 rounded-2xl font-semibold hover:border-primary hover:text-primary hover:bg-primary/5 transition-all duration-300 flex items-center justify-center backdrop-blur-sm"
              >
                <Image src="/icons8-dish-100.png" alt="menu" width={30} height={30} className="mr-2" />
                Browse Restaurants
              </Link>
            </div>
            
            <div className={`flex items-center justify-center lg:justify-start mt-12 space-x-8 transform transition-all duration-1000 delay-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
              <div className="text-center group">
                <div className="text-3xl font-bold text-gray-900 group-hover:text-primary transition-colors duration-300">100+</div>
                <div className="text-sm text-gray-600 font-medium">Orders Delivered</div>
              </div>
              <div className="w-px h-12 bg-gray-300"></div>
              <div className="text-center group">
                <div className="text-3xl font-bold text-gray-900 group-hover:text-primary transition-colors duration-300">50+</div>
                <div className="text-sm text-gray-600 font-medium">Partner Restaurants</div>
              </div>
              <div className="w-px h-12 bg-gray-300"></div>
              <div className="text-center group">
                <div className="text-3xl font-bold text-gray-900 group-hover:text-primary transition-colors duration-300">25min</div>
                <div className="text-sm text-gray-600 font-medium">Avg Delivery Time</div>
              </div>
            </div>
          </div>
          
          {/* Right Content*/}
          <div className={`relative transform transition-all duration-1000 delay-600 ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'}`}>
            <div className="relative z-10">
              <Card className="w-full rounded-3xl shadow-2xl p-2 group hover:shadow-3xl transition-all duration-500">
                {/* Phone Mockup */}
                <div className="w-full bg-gray-900 rounded-3xl p-2">
                  <CardContent className="bg-white rounded-2xl p-4 h-96 overflow-hidden">
                    {/* App Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                          <Image src="/icons8-dish-100.png" alt="dish" width={34} height={34} className="object-contain" />
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-xl text-orange-500">FoodFusion</span>
                        </div>
                      </div>
                      <div className="text-2xl">🛒</div>
                    </div>

                    {/* Search (Input) */}
                    <div className="mb-4">
                      <Input aria-label="Search restaurants" placeholder="Search restaurants..." />
                    </div>

                    {/* Food Categories */}
                    <div className="mb-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          { key: 'pizza', label: 'Pizza', emoji: '🍕', bg: 'bg-red-100' },
                          { key: 'burger', label: 'Burger', emoji: '🍔', bg: 'bg-yellow-100' },
                          { key: 'asian', label: 'Asian', emoji: '🍜', bg: 'bg-green-100' },
                          { key: 'mexican', label: 'Mexican', emoji: '🌮', bg: 'bg-orange-100' },
                        ].map((c) => (
                          <button
                            key={c.key}
                            type="button"
                            className={`flex flex-col items-center justify-center space-y-1 p-2 rounded-xl hover:scale-105 transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-primary ${c.bg}`}
                            aria-label={c.label}
                          >
                            <div className="w-12 h-12 flex items-center justify-center text-lg">
                              <span>{c.emoji}</span>
                            </div>
                            <span className="text-xs text-gray-600">{c.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Restaurant Cards */}
                    <div className="space-y-3">
                      <Card className="bg-gray-50 rounded-xl p-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                            <span className="text-white">🍕</span>
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-sm text-black">Pizza Palace</div>
                            <div className="text-xs text-gray-500">⭐ 4.8 • 25-30 min</div>
                          </div>
                          <Button variant="ghost" size="sm" aria-label="Order Pizza Palace">Order</Button>
                        </div>
                      </Card>

                      <Card className="bg-gray-50 rounded-xl p-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                            <span className="text-white">🍔</span>
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-sm text-black">Burger House</div>
                            <div className="text-xs text-gray-500">⭐ 4.6 • 20-25 min</div>
                          </div>
                          <Button variant="ghost" size="sm" aria-label="Order Burger House">Order</Button>
                        </div>
                      </Card>
                    </div>
                  </CardContent>
                </div>
              </Card>
            </div>

            {/* Floating Elements */}
            <div className="absolute -top-4 -left-4 h-24 w-24 bg-yellow-500 text-white rounded-2xl shadow-xl p-3 animate-pulse" aria-hidden></div>

            <div className="absolute -top-4 -right-4 h-24 w-24 bg-primary text-white rounded-2xl shadow-xl p-4 animate-bounce" aria-hidden></div>
            
            <div className="absolute -bottom-8 -left-4 h-24 w-24 bg-green-500 text-white rounded-2xl shadow-xl p-4 animate-bounce delay-500" aria-hidden></div>
            
            <div className="absolute -bottom-4 -right-4 h-24 w-24 bg-yellow-500 text-white rounded-2xl shadow-xl p-3 animate-pulse" aria-hidden></div>
          </div>
        </div>
      </div>
    </section>
  )
}