'use client'

import { useEffect, useState } from 'react'

const stats = [
  { number: 50000, label: 'Orders Delivered', suffix: '+' },
  { number: 1200, label: 'Partner Restaurants', suffix: '+' },
  { number: 25, label: 'Cities Covered', suffix: '+' },
  { number: 98, label: 'Customer Satisfaction', suffix: '%' }
]

export default function Stats() {
  const [counters, setCounters] = useState(stats.map(() => 0))

  useEffect(() => {
    const intervals = stats.map((stat, index) => {
      return setInterval(() => {
        setCounters(prev => {
          const newCounters = [...prev]
          if (newCounters[index] < stat.number) {
            newCounters[index] = Math.min(newCounters[index] + Math.ceil(stat.number / 100), stat.number)
          }
          return newCounters
        })
      }, 50)
    })

    return () => intervals.forEach(clearInterval)
  }, [])

  return (
    <section className="py-16 bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl lg:text-5xl font-bold text-primary mb-2">
                {counters[index]}{stat.suffix}
              </div>
              <div className="text-gray-300">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}