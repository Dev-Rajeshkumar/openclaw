'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';
import { validateGSTIN, validateHSN, suggestHSNFromDescription } from '@/utils/gstValidation';

interface GSTValidationPanelProps {
  gstNumber: string;
  hsnCode: string;
  description: string;
  gstRate: number;
  onHsnSuggestion?: (code: string, rate: number) => void;
}

export default function GSTValidationPanel({ gstNumber, hsnCode, description, gstRate, onHsnSuggestion }: GSTValidationPanelProps) {
  const [gstValidation, setGstValidation] = useState<ReturnType<typeof validateGSTIN> | null>(null);
  const [hsnValidation, setHsnValidation] = useState<ReturnType<typeof validateHSN> | null>(null);
  const [hsnSuggestions, setHsnSuggestions] = useState<Array<{ code: string; description: string; rate: number }>>([]);

  useEffect(() => {
    if (gstNumber && gstNumber.length >= 2) {
      const result = validateGSTIN(gstNumber);
      setGstValidation(result);
    } else {
      setGstValidation(null);
    }
  }, [gstNumber]);

  useEffect(() => {
    if (hsnCode && hsnCode.length >= 2) {
      const result = validateHSN(hsnCode);
      setHsnValidation(result);
    } else {
      setHsnValidation(null);
    }
  }, [hsnCode]);

  useEffect(() => {
    if (description && description.length >= 3) {
      const suggestions = suggestHSNFromDescription(description);
      setHsnSuggestions(suggestions);
    } else {
      setHsnSuggestions([]);
    }
  }, [description]);

  if (!gstNumber && !hsnCode && !description) return null;

  return (
    <div className="space-y-2">
      {/* GSTIN Validation */}
      {gstValidation && (
        <div className={`flex items-start gap-2 p-2 rounded-lg text-xs ${
          gstValidation.valid && gstValidation.errors.length === 0
            ? 'bg-green-50 dark:bg-green-900/20'
            : gstValidation.errors.length > 0
            ? 'bg-red-50 dark:bg-red-900/20'
            : 'bg-amber-50 dark:bg-amber-900/20'
        }`}>
          {gstValidation.valid && gstValidation.errors.length === 0 ? (
            <CheckCircle size={14} className="text-green-600 mt-0.5 shrink-0" />
          ) : gstValidation.errors.length > 0 ? (
            <XCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
          ) : (
            <AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" />
          )}
          <div>
            {gstValidation.valid && gstValidation.stateName && (
              <p className="text-green-700 dark:text-green-300">
                ✅ Valid GSTIN — {gstValidation.stateName} ({gstValidation.stateCode})
              </p>
            )}
            {gstValidation.errors.map((err, i) => (
              <p key={i} className="text-red-600 dark:text-red-400">❌ {err}</p>
            ))}
            {gstValidation.warnings.map((warn, i) => (
              <p key={i} className="text-amber-600 dark:text-amber-400">⚠️ {warn}</p>
            ))}
          </div>
        </div>
      )}

      {/* HSN Validation */}
      {hsnValidation && hsnValidation.errors.length > 0 && (
        <div className="flex items-start gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-xs">
          <XCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
          <div>
            {hsnValidation.errors.map((err, i) => (
              <p key={i} className="text-red-600 dark:text-red-400">❌ {err}</p>
            ))}
          </div>
        </div>
      )}

      {/* HSN Suggestions */}
      {hsnSuggestions.length > 0 && (
        <div className="flex items-start gap-2 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-xs">
          <Info size={14} className="text-blue-500 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="text-blue-700 dark:text-blue-300 font-medium">Suggested HSN Codes:</p>
            {hsnSuggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onHsnSuggestion?.(s.code, s.rate)}
                className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
              >
                <span className="font-mono">{s.code}</span>
                <span>—</span>
                <span>{s.description}</span>
                <span className="text-gray-400">({s.rate}%)</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
