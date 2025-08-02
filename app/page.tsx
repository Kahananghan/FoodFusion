import Hero from '@/components/Hero'
import FeaturedRestaurants from '@/components/FeaturedRestaurants'
import Categories from '@/components/Categories'
import Stats from '@/components/Stats'
import Features from '@/components/Features'
import CTA from '@/components/CTA'

export default function Home() {
  return (
    <div>
      <Hero />
      <Stats />
      <Categories />
      <Features />
      <FeaturedRestaurants />
      <CTA />
    </div>
  )
}