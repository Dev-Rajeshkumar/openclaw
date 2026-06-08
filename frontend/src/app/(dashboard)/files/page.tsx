'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { Upload, Search, FileText, Image, File, Trash2, Download, Plus } from 'lucide-react';
import { IFile } from '@/types';
import { formatDate } from '@/lib/utils';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return <Image size={18} className="text-blue-500" />;
  if (mimeType === 'application/pdf') return <FileText size={18} className="text-red-500" />;
  return <File size={18} className="text-gray-500" />;
}

export default function FilesPage() {
  const [files, setFiles] = useState<IFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [entityFilter, setEntityFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20', ...(search && { search }), ...(entityFilter && { entityType: entityFilter }) });
      const { data } = await api.get(`/files?${params}`);
      if (data.success && data.data) {
        setFiles(data.data as IFile[]);
        setTotalPages(data.meta?.totalPages || 1);
      }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  }, [page, search, entityFilter]);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.post('/files/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('File uploaded!');
      fetchFiles();
    } catch (error: unknown) { toast.error(error instanceof Error ? error.message : 'Upload failed'); } finally { setUploading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this file?')) return;
    try { await api.delete(`/files/${id}`); toast.success('Deleted'); fetchFiles(); }
    catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900">Files & Documents</h1><p className="text-gray-500">Manage uploaded documents</p></div>
        <div>
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" />
          <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? <><Skeleton className="h-4 w-4 mr-2" />Uploading...</> : <><Upload size={18} className="mr-2" /> Upload</>}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 w-full">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input placeholder="Search files..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-10" />
          </div>
          <Select value={entityFilter} onValueChange={(v) => { setEntityFilter(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="All Types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Types</SelectItem>
              <SelectItem value="Invoice">Invoices</SelectItem>
              <SelectItem value="Receipt">Receipts</SelectItem>
              <SelectItem value="Document">Documents</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {loading ? <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />}</div> :
            files.length > 0 ? (
              <>
                <Table>
                  <TableHeader><TableRow><TableHead>File</TableHead><TableHead>Type</TableHead><TableHead>Size</TableHead><TableHead>Linked To</TableHead><TableHead>Uploaded</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {files.map((f) => (
                      <TableRow key={f.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {getFileIcon(f.mimeType)}
                            <span className="font-medium text-sm truncate max-w-48">{f.fileName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-500 text-sm">{f.entityType}</TableCell>
                        <TableCell className="text-gray-500 text-sm">{formatFileSize(f.size)}</TableCell>
                        <TableCell className="text-gray-500 text-sm">{f.entityId ? f.entityId.slice(0, 8) : '—'}</TableCell>
                        <TableCell className="text-gray-500 text-sm">{formatDate(f.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" asChild>
                              <a href={f.fileUrl} target="_blank" rel="noopener noreferrer" title="Download">
                                <Download size={16} />
                              </a>
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(f.id)} className="text-red-500" title="Delete">
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                      <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="py-12 text-center">
                <FileText size={40} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">No files uploaded yet</p>
                <Button onClick={() => fileInputRef.current?.click()}>
                  <Plus size={18} className="mr-2" /> Upload Your First File
                </Button>
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
