'use client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CreditCard } from 'lucide-react';

export default function PaymentsPage() {
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Payments</h1><p className="text-gray-500">View all payment transactions</p></div>
      <Card><CardHeader><Input placeholder="Search payments..." className="max-w-sm" /></CardHeader>
        <CardContent><div className="py-12 text-center"><CreditCard size={40} className="text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No payments recorded yet</p></div></CardContent>
      </Card>
    </div>
  );
}
