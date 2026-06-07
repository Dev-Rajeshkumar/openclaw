'use client';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function NewEstimatePage() {
  const router = useRouter();
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4"><Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft size={20} /></Button>
        <div><h1 className="text-2xl font-bold text-gray-900">New Estimate</h1><p className="text-gray-500">Create a professional quotation</p></div>
      </div>
      <Card><CardHeader><CardTitle>Estimate Details</CardTitle></CardHeader><CardContent><p className="text-gray-400 text-sm">Estimate form coming soon. Use the API to create estimates in the meantime.</p></CardContent></Card>
    </div>
  );
}
