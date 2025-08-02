import Link from 'next/link'
import { ArrowRight, Smartphone } from 'lucide-react'

export default function CTA() {
  return (
    <section className="py-20 bg-gradient-to-r from-primary to-orange-600 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full" style={{backgroundImage: "url('data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')"}}></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Ready to satisfy your cravings?
            </h2>
            <p className="text-xl mb-8 text-white/90">
              Join thousands of food lovers who trust us for their daily meals. Download our app or order online now!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href="/restaurants" 
                className="group bg-white text-primary px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center"
              >
                Order Now
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
              
              <button className="group border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white hover:text-primary transition-all duration-300 flex items-center justify-center">
                <Smartphone className="mr-2 h-5 w-5" />
                Download App
              </button>
            </div>
            
            <div className="flex items-center mt-8 space-x-6">
              <div className="flex -space-x-2">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-10 h-10 bg-white/20 rounded-full border-2 border-white"></div>
                ))}
              </div>
              <div>
                <div className="text-sm font-semibold">Join 50,000+ happy customers</div>
                <div className="text-white/80 text-sm">⭐⭐⭐⭐⭐ 4.9/5 rating</div>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
              <div className="text-center">
                <div className="text-6xl mb-4">📱</div>
                <h3 className="text-2xl font-bold mb-4">Get the App</h3>
                <p className="text-white/90 mb-6">
                  Download our mobile app for the best ordering experience with exclusive deals and faster checkout.
                </p>
                
                <div className="flex flex-col space-y-3">
                  <div className="bg-black text-white px-6 py-3 rounded-lg flex items-center justify-center space-x-2 cursor-pointer hover:bg-gray-800 transition">
                    <span>📱</span>
                    <div className="text-left">
                      <div className="text-xs">Download on the</div>
                      <div className="font-semibold">App Store</div>
                    </div>
                  </div>
                  
                  <div className="bg-black text-white px-6 py-3 rounded-lg flex items-center justify-center space-x-2 cursor-pointer hover:bg-gray-800 transition">
                    <span>🤖</span>
                    <div className="text-left">
                      <div className="text-xs">Get it on</div>
                      <div className="font-semibold">Google Play</div>
                    </div>
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