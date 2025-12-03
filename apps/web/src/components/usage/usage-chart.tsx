'use client';

/**
 * Usage Chart Component
 *
 * Line chart showing usage over time using recharts.
 */

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { UsageHistory } from '@/types/usage';

interface UsageChartProps {
  history: UsageHistory;
}

export function UsageChart({ history }: UsageChartProps) {
  // Format data for recharts
  const chartData = history.data.map((point) => ({
    date: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    'API Calls': point.apiCalls,
    'Storage (MB)': Math.round(point.storage / (1024 * 1024)),
    'Seats': point.seats,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="API Calls" 
              stroke="#8884d8" 
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line 
              type="monotone" 
              dataKey="Storage (MB)" 
              stroke="#82ca9d" 
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line 
              type="monotone" 
              dataKey="Seats" 
              stroke="#ffc658" 
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

