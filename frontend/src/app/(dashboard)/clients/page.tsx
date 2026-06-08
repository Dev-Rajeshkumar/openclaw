'use client';
import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Users, MoreHorizontal, Eye, Trash2 } from 'lucide-react';
import type { IClient } from '@/types';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';

export default function ClientsPage() {
  const [clients, setClients] = useState<IClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '12', ...(search && { search }) });
      const { data } = await api.get(`/clients?${params}`);
      if (data.success && data.data) { setClients(data.data as IClient[]); setTotalPages(data.meta?.totalPages || 1); }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this client?')) return;
    try { await api.delete(`/clients/${id}`); toast.success('Client deleted'); fetchClients(); }
    catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900">Clients</h1><p className="text-gray-500">Manage your client list</p></div>
        <Button asChild><a href="/dashboard/clients/new"><Plus size={18} className="mr-2" /> Add Client</a></Button>
      </div>
      <Card><CardContent className="p-4">
        <div className="relative"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><Input placeholder="Search clients..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-10" /></div>
      </CardContent></Card>
      {loading ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}</div> :
        clients.length > 0 ? (<>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map((client) => (
              <Card key={client.id} className="hover:shadow-md transition">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center"><Users size={18} className="text-amber-600" /></div>
                    <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal size={16} /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild><a href={`/dashboard/clients/${client.id}`} className="flex items-center gap-2"><Eye size={14} /> View</a></DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(client.id)} className="text-red-600 flex items-center gap-2"><Trash2 size={14} /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{client.name}</h3>
                  {client.email && <p className="text-sm text-gray-500">{client.email}</p>}
                  {client.phone && <p className="text-sm text-gray-500">{client.phone}</p>}
                  {client.gstNumber && <p className="text-xs text-gray-400 mt-2">GST: {client.gstNumber}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between"><p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
              <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button><Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button></div>
            </div>
          )}
        </>) : (
          <div className="py-12 text-center"><Users size={40} className="text-gray-300 mx-auto mb-3" /><p className="text-gray-500 mb-4">No clients yet</p><Button asChild><a href="/dashboard/clients/new"><Plus size={18} className="mr-2" /> Add Your First Client</a></Button></div>
        )}
    </div>
  );
}
