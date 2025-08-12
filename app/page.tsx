import Hero from '@/components/Hero'
import FeaturedRestaurants from '@/components/FeaturedRestaurants'
import Categories from '@/components/Categories'
import Stats from '@/components/Stats'
import Features from '@/components/Features'
import CTA from '@/components/CTA'

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <Hero />
      
      {/* Stats Section */}
      <Stats />
      
      {/* Categories Section with improved spacing */}
      <section className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white"></div>
        <div className="relative">
          <Categories />
        </div>
      </section>
      
      {/* Features Section with enhanced background */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white via-orange-50/30 to-white"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-orange-200/20 rounded-full blur-3xl"></div>
        <div className="relative">
          <Features />
        </div>
      </section>
      
      {/* Featured Restaurants with improved background */}
      <section className="bg-gradient-to-b from-white to-gray-50 py-4">
        <FeaturedRestaurants />
      </section>
      
      {/* CTA Section */}
      <CTA />
    </main>
  )
}