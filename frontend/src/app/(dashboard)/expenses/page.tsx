'use client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Receipt } from 'lucide-react';

export default function ExpensesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900">Expenses</h1><p className="text-gray-500">Track your business expenses</p></div>
        <Button asChild><a href="/dashboard/expenses/new"><Plus size={18} className="mr-2" /> Add Expense</a></Button>
      </div>
      <Card><CardHeader><Input placeholder="Search expenses..." className="max-w-sm" /></CardHeader>
        <CardContent><div className="py-12 text-center"><Receipt size={40} className="text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No expenses recorded yet</p></div></CardContent>
      </Card>
    </div>
  );
}
