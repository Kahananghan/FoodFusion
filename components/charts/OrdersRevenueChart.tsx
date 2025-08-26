"use client"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import * as React from 'react'

export interface OrdersRevenuePoint {
  date: string
  orders: number
  revenue: number
}

// Simple combined bar chart for orders & revenue over a recent range
export function OrdersRevenueChart({ data }: { data: OrdersRevenuePoint[] }) {
  if (!data) return null
  const base = data.map(d => ({
    label: d.date.slice(5).replace('-', '/'),
    orders: d.orders,
    revenue: d.revenue
  }))
  const formatted = base
  const maxOrders = Math.max(1, ...formatted.map(f => f.orders))
  const maxRevenue = Math.max(1, ...formatted.map(f => f.revenue))

  const legendItems = [
    { key: 'orders', label: 'Orders', color: '#f97316' }, // orange-500
    { key: 'revenue', label: 'Revenue', color: '#6366f1' } // indigo-500
  ]

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null
    const ordersPoint = payload.find((p: any) => p.dataKey === 'orders')
    const revenuePoint = payload.find((p: any) => p.dataKey === 'revenue')
    return (
      <div className="rounded-md border bg-white dark:bg-gray-900 px-3 py-2 shadow-sm text-[11px] space-y-1">
        <div className="font-medium text-gray-600 dark:text-gray-300">{label}</div>
        {ordersPoint && (
          <div className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-sm" style={{ background: ordersPoint.color || '#f97316' }} />
            <span className="text-gray-500 dark:text-gray-400">Orders:</span>
            <span className="font-semibold text-gray-700 dark:text-gray-200 tabular-nums">{ordersPoint.value}</span>
          </div>
        )}
        {revenuePoint && (
          <div className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-sm" style={{ background: revenuePoint.color || '#6366f1' }} />
            <span className="text-gray-500 dark:text-gray-400">Revenue:</span>
            <span className="font-semibold text-gray-700 dark:text-gray-200 tabular-nums">₹{Number(revenuePoint.value).toLocaleString()}</span>
          </div>
        )}
      </div>
    )
  }

  const renderLegend = () => (
    <div className="flex flex-wrap gap-4 px-2 pt-1 text-[11px] font-medium">
      {legendItems.map(item => (
        <span key={item.key} className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: item.color }} />
          <span style={{ color: item.color }}>{item.label}</span>
        </span>
      ))}
    </div>
  )

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={formatted} margin={{ top: 8, right: 12, left: 4, bottom: 28 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
            <YAxis yAxisId="orders" orientation="left" tickLine={false} axisLine={false} fontSize={11} allowDecimals={false} domain={[0, maxOrders]} />
            <YAxis yAxisId="revenue" orientation="right" tickLine={false} axisLine={false} fontSize={11} allowDecimals={false} domain={[0, maxRevenue]} />
          <Tooltip cursor={{ fill: 'rgba(251,146,60,0.08)' }} content={<CustomTooltip />} />
          <Legend content={renderLegend} verticalAlign="bottom" />
          <Bar yAxisId="orders" dataKey="orders" name="Orders" radius={[4,4,0,0]} fill="#f97316" />
          <Bar yAxisId="revenue" dataKey="revenue" name="Revenue" radius={[4,4,0,0]} fill="#6366f1" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
