'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Save, Trash2, Package } from 'lucide-react';
import { IProduct } from '@/types';
import { formatCurrency } from '@/lib/utils';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [product, setProduct] = useState<IProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', sku: '', unitPrice: 0, taxRate: 18, category: '' });

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await api.get(`/products/${id}`);
        if (data.success && data.data) {
          const p = data.data as IProduct;
          setProduct(p);
          setForm({
            name: p.name || '',
            description: p.description || '',
            sku: p.sku || '',
            unitPrice: p.unitPrice || 0,
            taxRate: p.taxRate || 18,
            category: p.category || '',
          });
        }
      } catch { toast.error('Failed to load product'); }
      setLoading(false);
    };
    fetchProduct();
  }, [id]);

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Product name is required'); return; }
    setSaving(true);
    try {
      const { data: result } = await api.put(`/products/${id}`, {
        ...form,
        unitPrice: Number(form.unitPrice),
        taxRate: Number(form.taxRate),
      });
      if (result.success && result.data) {
        setProduct(result.data as IProduct);
        setIsEditing(false);
        toast.success('Product updated!');
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to update product');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted');
      router.push('/dashboard/products');
    } catch { toast.error('Failed to delete'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" /></div>;
  if (!product) return <div className="text-center py-12"><p className="text-gray-500">Product not found</p><Button variant="link" onClick={() => router.push('/dashboard/products')}>Back to Products</Button></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft size={20} /></Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
            <p className="text-gray-500 text-sm">{product.category || 'No category'} • {product.sku || 'No SKU'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Save size={14} className="mr-1" /> Edit
            </Button>
          )}
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 size={14} className="mr-1" /> Delete
          </Button>
        </div>
      </div>

      {isEditing ? (
        <Card>
          <CardHeader><CardTitle>Edit Product</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Product name" />
              </div>
              <div className="space-y-1">
                <Label>SKU</Label>
                <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="SKU-001" />
              </div>
              <div className="space-y-1">
                <Label>Category</Label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Category" />
              </div>
              <div className="space-y-1">
                <Label>Unit Price *</Label>
                <Input type="number" min="0" step="0.01" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="space-y-1">
                <Label>Tax Rate (%)</Label>
                <Input type="number" min="0" max="100" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Description / HSN Code</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Product description or HSN code" rows={3} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => {
                setIsEditing(false);
                setForm({
                  name: product.name || '',
                  description: product.description || '',
                  sku: product.sku || '',
                  unitPrice: product.unitPrice || 0,
                  taxRate: product.taxRate || 18,
                  category: product.category || '',
                });
              }}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <><Loader2 size={16} className="animate-spin mr-2" />Saving...</> : <><Save size={16} className="mr-2" />Save Changes</>}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-gray-400 mb-1">Unit Price</p>
                <p className="text-2xl font-bold text-amber-600">{formatCurrency(product.unitPrice)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-gray-400 mb-1">Tax Rate</p>
                <p className="text-2xl font-bold text-gray-900">{product.taxRate}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-gray-400 mb-1">Category</p>
                <p className="font-semibold text-gray-900">{product.category || '—'}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Package size={18} /> Product Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">SKU</p>
                  <p className="text-gray-900 font-medium">{product.sku || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Price with Tax</p>
                  <p className="text-gray-900 font-medium">{formatCurrency(product.unitPrice * (1 + product.taxRate / 100))}</p>
                </div>
              </div>
              {product.description && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Description</p>
                  <p className="text-gray-900">{product.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
