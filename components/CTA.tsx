"use client"

import Link from 'next/link'
import { ArrowRight, ShoppingCart, Zap, Star, Users, Check, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

export default function CTA() {
  return (
    <section className="py-20 bg-gradient-to-br from-primary via-orange-600 to-red-600 text-white relative overflow-hidden">
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
  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="flex-1 lg:pr-8">
            <div className="mb-4 flex items-center gap-3">
              <Badge className="bg-white/12 text-white inline-flex items-center gap-2"><Users className="h-4 w-4" /> 500+ customers</Badge>
              <div className="text-sm text-white/80">• <span className="font-medium">Free delivery</span> over ₹500</div>
            </div>

            <h2 className="text-4xl lg:text-5xl font-extrabold mb-3 leading-tight">
              Crave it. Order it.
            </h2>
            <h3 className="text-2xl lg:text-3xl font-semibold mb-4 bg-gradient-to-r from-yellow-300 to-white bg-clip-text text-transparent">Love it — delivered fast.</h3>

            <p className="text-base mb-6 text-white/90 max-w-lg">Top restaurants, exclusive deals, and lightning-fast delivery. Sign up to get the latest offers and a welcome deal.</p>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex gap-3 w-full sm:w-auto">
                <Button asChild size="lg" className="bg-gradient-to-r from-yellow-400 to-orange-400 shadow-lg text-black hover:opacity-95">
                  <Link href="/restaurants" aria-label="Order now" className="flex items-center">
                    <ShoppingCart className="mr-3 h-5 w-5" />
                    Order Now
                  </Link>
                </Button>

                <Button asChild variant="ghost" size="lg" className="hidden sm:inline-flex border border-white/20 text-white hover:bg-white/10 !bg-transparent">
                  <Link href="/restaurants" aria-label="Browse menu" className="flex items-center bg-transparent">
                    <Zap className="mr-3 h-5 w-5" />
                    Browse Menu
                  </Link>
                </Button>
              </div>

              {/* Mobile visible secondary action */}
              <Button asChild variant="ghost" size="lg" className="sm:hidden w-full border border-white/20 text-white hover:bg-white/10 !bg-transparent">
                <Link href="/restaurants" aria-label="Browse menu mobile" className="flex items-center justify-center bg-transparent">
                  <Zap className="mr-3 h-5 w-5" />
                  Browse Menu
                </Link>
              </Button>
            </div>

            {/* Email form moved below buttons */}
            <div className="mt-4 sm:mt-6 w-full sm:w-auto">
              <form className="w-full" onSubmit={(e) => e.preventDefault()}>
                <div className="relative w-full sm:w-[320px]">
                  <Input aria-label="Enter email" placeholder="Email for deals" className="!bg-white/8 text-white placeholder-white/60 rounded-full pl-4 pr-28" />
                  <Button type="submit" className="absolute right-1 top-1 bottom-1 px-4 rounded-full">Notify</Button>
                </div>
              </form>
            </div>

            <div className="flex items-center mt-8 gap-4">
            
              {/* Logo from public folder */}
              <div className="flex items-center">
                <Image src="/icons8-dish-100.png" alt="FoodFusion logo" width={48} height={48} className="rounded-full bg-white p-1" />
              </div>

              <div>
                <div className="text-sm font-medium">Trusted by thousands</div>
                <div className="text-yellow-300 font-semibold">4.8/5 average rating</div>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-[480px] relative self-stretch lg:self-auto lg:sticky lg:top-28">
            <Card className="h-full bg-white/6 backdrop-blur-md rounded-3xl p-6 border border-white/10 shadow-2xl group hover:scale-[1.02] transition-transform duration-400">
              <CardHeader className="p-4 pt-2">
                <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-yellow-300 flex items-center justify-center mb-3 shadow-lg">
                  <ShoppingCart className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-center text-white">Order Online</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-center">
                <p className="text-white/80 mb-6">Seamless ordering with real-time tracking, multiple payment methods, and web-only deals.</p>

                <ul className="text-sm text-white/90 mb-6 space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="flex items-center justify-center w-7 h-7 bg-white/10 rounded-full"><Check className="h-4 w-4" /></span>
                    <span>Instant checkout & secure payments</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex items-center justify-center w-7 h-7 bg-white/10 rounded-full"><Clock className="h-4 w-4" /></span>
                    <span>Real-time order tracking</span>
                  </li>
                </ul>

                <div className="flex items-center justify-center gap-3">
                  <Button asChild className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black">
                    <Link href="/restaurants" aria-label="Start ordering" className="flex items-center">
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Start Ordering
                    </Link>
                  </Button>
                  <Button variant="ghost" asChild className="border border-white/20 text-white hover:bg-white/10 !bg-transparent">
                    <Link href="/restaurants" aria-label="See deals" className="flex items-center bg-transparent">
                      <ArrowRight className="mr-2 h-4 w-4" />
                      See Deals
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}