import { Clock, Shield, MapPin, Star } from 'lucide-react'

const features = [
  {
    icon: Clock,
    title: 'Lightning Fast Delivery',
    description: 'Get your food delivered in 30 minutes or less with our optimized delivery network.',
    color: 'bg-blue-100 text-blue-600'
  },
  {
    icon: Shield,
    title: 'Safe & Secure',
    description: 'Your payments are protected with bank-level security and contactless delivery options.',
    color: 'bg-green-100 text-green-600'
  },
  {
    icon: MapPin,
    title: 'Real-time Tracking',
    description: 'Track your order from kitchen to doorstep with live GPS tracking and updates.',
    color: 'bg-purple-100 text-purple-600'
  },
  {
    icon: Star,
    title: 'Quality Guaranteed',
    description: 'Only the best restaurants with highest ratings and freshest ingredients.',
    color: 'bg-yellow-100 text-yellow-600'
  }
]

export default function Features() {
  return (
    <section className="py-24 bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <div className="inline-flex items-center bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            ✨ Why Choose Us
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">Exceptional Service</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            We're committed to delivering not just food, but an exceptional experience that exceeds your expectations every single time.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="group p-10 rounded-3xl bg-white border border-gray-100 hover:border-primary/30 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-4 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className={`w-20 h-20 ${feature.color} rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 relative z-10`}>
                <feature.icon className="h-10 w-10" />
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-primary transition-colors duration-300 relative z-10">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed text-lg relative z-10">{feature.description}</p>
              
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-orange-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}