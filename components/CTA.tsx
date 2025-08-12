import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function CTA() {
  return (
    <section className="py-24 bg-gradient-to-br from-primary via-orange-600 to-red-600 text-white relative overflow-hidden">
      {/* Enhanced Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full" style={{backgroundImage: "url('data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')"}}></div>
      </div>
      
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium mb-8">
              🎉 Join 50,000+ Happy Customers
            </div>
            
            <h2 className="text-4xl lg:text-6xl font-bold mb-8 leading-tight">
              Ready to satisfy your <span className="text-yellow-300">cravings?</span>
            </h2>
            <p className="text-xl mb-10 text-white/90 leading-relaxed">
              Join thousands of food lovers who trust us for their daily meals. Order online now and get your first delivery free!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6">
              <Link 
                href="/restaurants" 
                className="group bg-white text-primary px-10 py-5 rounded-2xl font-bold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-3xl flex items-center justify-center text-lg relative overflow-hidden"
              >
                <span className="relative z-10">Order Now</span>
                <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform duration-300 relative z-10" />
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-orange-600/10 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              </Link>
              
              <button className="group border-2 border-white/50 text-white px-10 py-5 rounded-2xl font-bold hover:bg-white hover:text-primary hover:border-white transition-all duration-300 flex items-center justify-center text-lg backdrop-blur-sm">
                <span className="mr-3 text-2xl group-hover:scale-110 transition-transform duration-300">🍴</span>
                Browse Menu
              </button>
            </div>
            
            <div className="flex items-center mt-12 space-x-8">
              <div className="flex -space-x-3">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="w-12 h-12 bg-gradient-to-br from-white/30 to-white/10 rounded-full border-3 border-white backdrop-blur-sm flex items-center justify-center text-white font-bold">
                    {i === 3 ? '😋' : '😊'}
                  </div>
                ))}
              </div>
              <div>
                <div className="text-lg font-bold">Trusted by thousands</div>
                <div className="text-yellow-300 text-lg font-semibold">⭐⭐⭐⭐⭐ 4.9/5 rating</div>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-10 border border-white/30 shadow-2xl group hover:bg-white/15 transition-all duration-500">
              <div className="text-center">
                <div className="text-8xl mb-6 group-hover:scale-110 transition-transform duration-500">🍽️</div>
                <h3 className="text-3xl font-bold mb-6">Order Online</h3>
                <p className="text-white/90 mb-8 text-lg leading-relaxed">
                  Experience seamless online ordering with real-time tracking, multiple payment options, and exclusive web deals.
                </p>
                
                <div className="space-y-6">
                  <div className="bg-white/20 backdrop-blur-sm px-6 py-4 rounded-2xl border border-white/30">
                    <div className="flex items-center justify-center space-x-3 mb-2">
                      <span className="text-2xl">⚡</span>
                      <span className="font-bold text-lg">Fast Checkout</span>
                    </div>
                    <p className="text-white/80 text-sm">Quick and secure payment process</p>
                  </div>
                  
                  <div className="bg-white/20 backdrop-blur-sm px-6 py-4 rounded-2xl border border-white/30">
                    <div className="flex items-center justify-center space-x-3 mb-2">
                      <span className="text-2xl">🎯</span>
                      <span className="font-bold text-lg">Live Tracking</span>
                    </div>
                    <p className="text-white/80 text-sm">Track your order in real-time</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}