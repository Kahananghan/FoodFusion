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
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose Us?</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We're committed to delivering not just food, but an exceptional experience every time.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="group p-8 rounded-2xl border border-gray-100 hover:border-primary/20 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
            >
              <div className={`w-16 h-16 ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}