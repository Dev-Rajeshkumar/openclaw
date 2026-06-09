'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Code, Copy, Trash2, Plus, Eye, EyeOff, Shield, Terminal, Key, AlertTriangle } from 'lucide-react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsedAt?: string;
}

export default function DevelopersPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createdKey, setCreatedKey] = useState<{ id: string; name: string; key: string } | null>(null);

  const fetchKeys = useCallback(async () => {
    try {
      const { data } = await api.get('/api-keys');
      if (data.success) setKeys(data.data);
    } catch {
      toast.error('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchKeys(); }, [fetchKeys]);

  const handleCreate = async () => {
    if (!newKeyName.trim()) { toast.error('Please enter a key name'); return; }
    setCreating(true);
    try {
      const { data } = await api.post('/api-keys', { name: newKeyName.trim() });
      if (data.success) {
        setCreatedKey(data.data);
        setNewKeyName('');
        toast.success('API key created');
        fetchKeys();
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to create key');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this API key? Applications using it will lose access.')) return;
    try {
      await api.delete(`/api-keys/${id}`);
      toast.success('API key deleted');
      if (createdKey?.id === id) setCreatedKey(null);
      fetchKeys();
    } catch {
      toast.error('Failed to delete key');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleDismissCreated = () => {
    setCreatedKey(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Code size={24} /> Developer API
        </h1>
        <p className="text-gray-500 dark:text-gray-400">Manage API keys and integrate BillingBee with your applications</p>
      </div>

      {/* Created Key Banner */}
      {createdKey && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-5 space-y-3">
          <div className="flex items-start gap-2">
            <AlertTriangle size={20} className="text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-amber-800 dark:text-amber-200">API Key Created</p>
              <p className="text-sm text-amber-700 dark:text-amber-300">Copy this key now — it won&apos;t be shown again.</p>
            </div>
            <Button size="sm" variant="ghost" onClick={handleDismissCreated} className="ml-auto text-amber-600 hover:text-amber-800">
              Dismiss
            </Button>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-amber-200 dark:border-amber-800 p-3 flex items-center gap-3">
            <code className="flex-1 text-sm font-mono text-gray-900 dark:text-amber-300 break-all select-all">{createdKey.key}</code>
            <Button size="sm" variant="outline" onClick={() => handleCopy(createdKey.key)} className="shrink-0 border-amber-300">
              <Copy size={14} className="mr-1" /> Copy
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* API Keys List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Key size={18} /> API Keys</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500" /></div>
            ) : keys.length === 0 ? (
              <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                <Shield size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No API keys yet</p>
                <p className="text-xs">Create one to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {keys.map((k) => (
                  <div key={k.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 dark:text-white text-sm">{k.name}</p>
                      <p className="text-xs font-mono text-gray-400 dark:text-gray-500">{k.key}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Created {new Date(k.createdAt).toLocaleDateString()}
                        {k.lastUsedAt && ` · Last used ${new Date(k.lastUsedAt).toLocaleDateString()}`}
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(k.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0 ml-2">
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create New Key */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Plus size={18} /> Create New Key</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="keyName">Key Name</Label>
                <Input
                  id="keyName"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g. My App, Integration, etc."
                />
              </div>
              <Button onClick={handleCreate} disabled={creating || !newKeyName.trim()} className="w-full">
                {creating ? (
                  <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" /> Generating...</>
                ) : (
                  <><Key size={16} className="mr-2" /> Generate Key</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* API Documentation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Terminal size={18} /> API Documentation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Base URL</h4>
            <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-3 flex items-center gap-2">
              <code className="text-green-400 text-sm flex-1">http://localhost:3001/api/v1</code>
              <Button size="sm" variant="ghost" onClick={() => handleCopy('http://localhost:3001/api/v1')} className="text-gray-400 hover:text-white shrink-0">
                <Copy size={14} />
              </Button>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Authentication</h4>
            <p className="text-sm text-gray-500 mb-2">Include your API key in the Authorization header:</p>
            <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-3">
              <code className="text-green-400 text-sm">Authorization: Bearer bbk_your_api_key_here</code>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Example Endpoints</h4>
            <div className="space-y-2">
              {[
                { method: 'GET', path: '/invoices', desc: 'List all invoices' },
                { method: 'POST', path: '/businesses/:id/invoices', desc: 'Create an invoice' },
                { method: 'GET', path: '/businesses/:id/clients', desc: 'List clients' },
                { method: 'POST', path: '/businesses/:id/clients', desc: 'Create a client' },
                { method: 'GET', path: '/businesses/:id/products', desc: 'List products' },
                { method: 'GET', path: '/payments', desc: 'List payments' },
                { method: 'GET', path: '/businesses/:id/reports/summary', desc: 'Get report summary' },
              ].map((ep) => (
                <div key={ep.method + ep.path} className="flex items-center gap-3 text-sm">
                  <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${ep.method === 'GET' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                    {ep.method}
                  </span>
                  <code className="text-gray-700 dark:text-gray-300 text-xs flex-1">{ep.path}</code>
                  <span className="text-gray-400 dark:text-gray-500 text-xs hidden sm:block">{ep.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Example cURL Request</h4>
            <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-3 overflow-x-auto">
              <pre className="text-green-400 text-xs whitespace-pre-wrap">{`curl -X GET "http://localhost:3001/api/v1/businesses/YOUR_BUSINESS_ID/invoices" \\
  -H "Authorization: Bearer bbk_your_api_key_here"`}</pre>
            </div>
            <Button size="sm" variant="ghost" className="mt-2 text-gray-500" onClick={() => handleCopy(`curl -X GET "http://localhost:3001/api/v1/businesses/YOUR_BUSINESS_ID/invoices" \\\n  -H "Authorization: Bearer bbk_your_api_key_here"`)}>
              <Copy size={14} className="mr-1" /> Copy curl command
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
