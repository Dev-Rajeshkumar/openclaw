'use client';
import { Card, CardContent } from '@/components/ui/card';
import { Bell } from 'lucide-react';

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Notifications</h1><p className="text-gray-500">Stay updated with your business activity</p></div>
      <Card><CardContent className="py-12 text-center"><Bell size={40} className="text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No notifications yet</p></CardContent></Card>
    </div>
  );
}
