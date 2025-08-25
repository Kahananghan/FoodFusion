"use client"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import * as React from 'react'

interface DayData { date: string; delivered: number }
export function DeliveryPerformanceChart({ data }: { data: DayData[] }) {
  const formatted = data.map(d => ({
    label: d.date.slice(5).replace('-','/'),
    delivered: d.delivered
  }))
  const max = Math.max(1, ...formatted.map(f=>f.delivered))
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={formatted} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
          <YAxis width={28} tickLine={false} axisLine={false} fontSize={11} allowDecimals={false} domain={[0, max]} />
          <Tooltip cursor={{ fill: 'rgba(99,102,241,0.08)' }} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
          <Bar dataKey="delivered" radius={[4,4,0,0]} className="fill-indigo-500" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
