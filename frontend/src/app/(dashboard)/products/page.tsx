'use client';
import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Package, Trash2, MoreHorizontal, Pencil } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { IProduct } from '@/types';
import { formatCurrency } from '@/lib/utils';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', sku: '', unitPrice: 0, taxRate: 18, category: '' });
  const [saving, setSaving] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '50', ...(search && { search }) });
      const { data } = await api.get(`/products?${params}`);
      if (data.success && data.data) setProducts(data.data as IProduct[]);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    try { await api.delete(`/products/${id}`); toast.success('Deleted'); fetchProducts(); }
    catch { toast.error('Failed'); }
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      await api.post('/products', { ...form, unitPrice: Number(form.unitPrice), taxRate: Number(form.taxRate) });
      toast.success('Product added!');
      setForm({ name: '', description: '', sku: '', unitPrice: 0, taxRate: 18, category: '' });
      setShowForm(false);
      fetchProducts();
    } catch (error: unknown) { toast.error(error instanceof Error ? error.message : 'Failed'); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900">Products</h1><p className="text-gray-500">Manage your products and services for invoicing</p></div>
        <Button onClick={() => setShowForm(!showForm)}><Plus size={18} className="mr-2" /> Add Product</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><h3 className="font-semibold text-gray-900">New Product</h3></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Name *</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Product name" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">SKU</label>
                <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="SKU-001" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Category</label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Category" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Unit Price *</label>
                <Input type="number" min="0" step="0.01" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Tax Rate (%)</label>
                <Input type="number" min="0" max="100" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">HSN Code</label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="HSN code" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Product'}</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="relative max-w-sm">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div> :
            products.length > 0 ? (
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>SKU</TableHead><TableHead>Category</TableHead><TableHead className="text-right">Price</TableHead><TableHead className="text-right">Tax</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {products.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="text-gray-500">{p.sku || '—'}</TableCell>
                      <TableCell className="text-gray-500">{p.category || '—'}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(p.unitPrice)}</TableCell>
                      <TableCell className="text-right text-gray-500">{p.taxRate}%</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal size={16} /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/dashboard/products/${p.id}`)} className="flex items-center gap-2"><Pencil size={14} /> Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(p.id)} className="text-red-600 flex items-center gap-2"><Trash2 size={14} /> Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-12 text-center">
                <Package size={40} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">No products yet</p>
                <Button onClick={() => setShowForm(true)}><Plus size={18} className="mr-2" /> Add Your First Product</Button>
              </div>
            )}
        </CardContent>
      </Card>
    </div>
    </div>
  );
}
