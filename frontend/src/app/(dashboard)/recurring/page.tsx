'use client';
import { Card, CardContent } from '@/components/ui/card';
import { Repeat } from 'lucide-react';
export default function RecurringPage() {
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Recurring Invoices</h1><p className="text-gray-500">Automate your billing</p></div>
      <Card><CardContent className="py-12 text-center"><Repeat size={40} className="text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No recurring invoices yet</p></CardContent></Card>
    </div>
  );
}
