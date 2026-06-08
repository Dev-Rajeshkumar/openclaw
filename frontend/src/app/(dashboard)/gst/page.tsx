'use client';
import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface GSTSummary {
  totalInvoices: number;
  totalTaxableValue: number;
  totalCGST: number;
  totalSGST: number;
  totalIGST: number;
  totalCESS: number;
  totalTax: number;
  totalInvoiceValue: number;
  byRate: Record<string, {
    taxableValue: number; cgst: number; sgst: number; igst: number; cess: number; totalTax: number; invoiceCount: number;
  }>;
}

export default function GSTReportsPage() {
  const [summary, setSummary] = useState<GSTSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [quarter, setQuarter] = useState('1');
  const [year, setYear] = useState('2025');

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/gst/summary?quarter=${quarter}&year=${year}`);
      if (data.success && data.data) setSummary(data.data.summary as GSTSummary);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => { fetchSummary(); }, [quarter, year]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">GST Reports</h1>
          <p className="text-gray-500">Tax summary and GSTR-1 data for filing</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={quarter} onValueChange={setQuarter}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Q1 (Apr-Jun)</SelectItem>
              <SelectItem value="2">Q2 (Jul-Sep)</SelectItem>
              <SelectItem value="3">Q3 (Oct-Dec)</SelectItem>
              <SelectItem value="4">Q4 (Jan-Mar)</SelectItem>
            </SelectContent>
          </Select>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="2026">2026-27</SelectItem>
              <SelectItem value="2025">2025-26</SelectItem>
              <SelectItem value="2024">2024-25</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchSummary} variant="outline"><FileText size={16} className="mr-2" /> Refresh</Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Card key={i}><CardContent className="p-5"><Skeleton className="h-4 w-24 mb-2" /><Skeleton className="h-8 w-32" /></CardContent></Card>)}
        </div>
      ) : summary ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card><CardContent className="p-5">
              <p className="text-xs text-gray-400 mb-1">Total Invoices</p>
              <p className="text-2xl font-bold text-gray-900">{summary.totalInvoices}</p>
            </CardContent></Card>
            <Card><CardContent className="p-5">
              <p className="text-xs text-gray-400 mb-1">Taxable Value</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalTaxableValue)}</p>
            </CardContent></Card>
            <Card><CardContent className="p-5">
              <p className="text-xs text-gray-400 mb-1">Total Tax</p>
              <p className="text-2xl font-bold text-amber-600">{formatCurrency(summary.totalTax)}</p>
            </CardContent></Card>
            <Card><CardContent className="p-5">
              <p className="text-xs text-gray-400 mb-1">CGST</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(summary.totalCGST)}</p>
            </CardContent></Card>
            <Card><CardContent className="p-5">
              <p className="text-xs text-gray-400 mb-1">SGST</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalSGST)}</p>
            </CardContent></Card>
            <Card><CardContent className="p-5">
              <p className="text-xs text-gray-400 mb-1">IGST</p>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(summary.totalIGST)}</p>
            </CardContent></Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Tax Rate Breakdown</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rate</TableHead>
                    <TableHead className="text-right">Invoices</TableHead>
                    <TableHead className="text-right">Taxable Value</TableHead>
                    <TableHead className="text-right">CGST</TableHead>
                    <TableHead className="text-right">SGST</TableHead>
                    <TableHead className="text-right">Total Tax</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(summary.byRate).map(([rate, data]) => (
                    <TableRow key={rate}>
                      <TableCell className="font-semibold">{rate}%</TableCell>
                      <TableCell className="text-right">{data.invoiceCount}</TableCell>
                      <TableCell className="text-right">{formatCurrency(data.taxableValue)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(data.cgst)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(data.sgst)}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(data.totalTax)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card><CardContent className="py-12 text-center">
          <FileText size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No invoice data for this period</p>
        </CardContent></Card>
      )}
    </div>
  );
}
