'use client';
import { useEffect, useState } from 'react';
import { Plus, Search, FileText } from 'lucide-react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function EstimatesPage() {
  const [loading, setLoading] = useState(true);
  useEffect(() => { setLoading(false); }, []);
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900">Estimates & Quotations</h1><p className="text-gray-500">Create and manage quotes for your clients</p></div>
        <Button asChild><a href="/dashboard/estimates/new"><Plus size={18} className="mr-2" /> New Estimate</a></Button>
      </div>
      <Card><CardHeader><Input placeholder="Search estimates..." className="max-w-sm" /></CardHeader>
        <CardContent>{loading ? <Skeleton className="h-48 w-full" /> : <><Table><TableHeader><TableRow><TableHead>Number</TableHead><TableHead>Client</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell colSpan={5} className="text-center py-12 text-gray-400">No estimates yet. Create your first estimate to get started.</TableCell></TableRow></TableBody></Table></>}</CardContent>
      </Card>
    </div>
  );
}
