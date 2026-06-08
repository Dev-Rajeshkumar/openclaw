'use client';

import { useState, useEffect } from 'react';
import { X, RotateCcw, Type } from 'lucide-react';
import { IInvoiceTemplate, ITemplateTextOverrides, SubscriptionPlan } from '@/types';
import { cn } from '@/lib/utils';

interface TemplateTextEditorProps {
  template: IInvoiceTemplate;
  overrides: ITemplateTextOverrides;
  onSave: (overrides: ITemplateTextOverrides) => void;
  onClose: () => void;
  isPremium: boolean;
}

const TEXT_FIELDS = [
  { key: 'labelInvoiceTitle', label: 'Invoice Title', placeholder: 'e.g., TAX INVOICE, Invoice, Bill' },
  { key: 'labelBillTo', label: 'Bill To Label', placeholder: 'e.g., Bill To:, Billed To, Client' },
  { key: 'labelSubtotal', label: 'Subtotal Label', placeholder: 'e.g., Subtotal:, Subtotal' },
  { key: 'labelDiscount', label: 'Discount Label', placeholder: 'e.g., Discount:, Disc' },
  { key: 'labelTax', label: 'Tax Label', placeholder: 'e.g., Tax:, GST, VAT' },
  { key: 'labelTotal', label: 'Total Label', placeholder: 'e.g., Total:, TOTAL, Total Due' },
  { key: 'labelNotes', label: 'Notes Label', placeholder: 'e.g., Notes:, Remarks' },
  { key: 'labelTerms', label: 'Terms Label', placeholder: 'e.g., Terms & Conditions:, Terms' },
  { key: 'footerText', label: 'Footer Text', placeholder: 'e.g., Thank you for your business!' },
];

export function TemplateTextEditor({ template, overrides, onSave, onClose, isPremium }: TemplateTextEditorProps) {
  const [values, setValues] = useState<ITemplateTextOverrides>({});

  useEffect(() => {
    // Start with existing overrides merged with template defaults
    const merged: ITemplateTextOverrides = {};
    TEXT_FIELDS.forEach(({ key }) => {
      const k = key as keyof ITemplateTextOverrides;
      merged[k] = overrides[k] || template.layout[k] || '';
    });
    setValues(merged);
  }, [template, overrides]);

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = (key: string) => {
    const defaultValue = template.layout[key] || '';
    setValues((prev) => ({ ...prev, [key]: defaultValue }));
  };

  const handleResetAll = () => {
    const reset: ITemplateTextOverrides = {};
    TEXT_FIELDS.forEach(({ key }) => {
      reset[key as keyof ITemplateTextOverrides] = template.layout[key] || '';
    });
    setValues(reset);
  };

  const handleSave = () => {
    // Only save non-empty values that differ from defaults
    const toSave: ITemplateTextOverrides = {};
    TEXT_FIELDS.forEach(({ key }) => {
      const k = key as keyof ITemplateTextOverrides;
      const val = values[k] || '';
      const defaultVal = template.layout[k] || '';
      if (val !== defaultVal) {
        toSave[k] = val;
      }
    });
    onSave(toSave);
  };

  if (!isPremium) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Type size={28} className="text-amber-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Premium Feature</h3>
          <p className="text-sm text-gray-500 mb-6">
            Customize template text labels with a Professional or Business plan. Change "Bill To" to "Client", "Total" to "Amount Due", and more.
          </p>
          <button onClick={onClose} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Customize Template Text</h3>
            <p className="text-xs text-gray-500 mt-0.5">Editing: {template.name} template</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition">
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        {/* Fields */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {TEXT_FIELDS.map(({ key, label, placeholder }) => (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-700">{label}</label>
                <button
                  onClick={() => handleReset(key)}
                  className="text-[10px] text-gray-400 hover:text-gray-600 flex items-center gap-0.5 transition"
                >
                  <RotateCcw size={10} /> Reset
                </button>
              </div>
              <input
                type="text"
                value={values[key as keyof ITemplateTextOverrides] || ''}
                onChange={(e) => handleChange(key, e.target.value)}
                placeholder={placeholder}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-amber-300 focus:border-amber-300 transition"
              />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-100">
          <button onClick={handleResetAll} className="text-xs text-gray-500 hover:text-gray-700 font-medium transition">
            Reset All to Defaults
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">
              Cancel
            </button>
            <button onClick={handleSave} className="px-4 py-2 text-sm bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
