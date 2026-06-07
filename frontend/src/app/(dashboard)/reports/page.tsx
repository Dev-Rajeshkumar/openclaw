'use client';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1><p className="text-gray-500">Insights into your business performance</p></div>
      <Card><CardContent className="py-12 text-center"><BarChart3 size={40} className="text-gray-300 mx-auto mb-3" /><p className="text-gray-500">Reports coming soon. Start creating invoices to see analytics.</p></CardContent></Card>
    </div>
  );
}
