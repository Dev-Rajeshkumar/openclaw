'use client';
import { Card, CardContent } from '@/components/ui/card';
import { Users } from 'lucide-react';
export default function TeamPage() {
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Team Management</h1><p className="text-gray-500">Invite and manage team members</p></div>
      <Card><CardContent className="py-12 text-center"><Users size={40} className="text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No team members yet</p></CardContent></Card>
    </div>
  );
}
