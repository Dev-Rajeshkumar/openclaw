'use client';

import { useEffect } from 'react';
import { Check, Lock, Palette } from 'lucide-react';
import { IInvoiceTemplate, SubscriptionPlan } from '@/types';
import { useTemplateStore } from '@/stores/templateStore';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface TemplateSelectorProps {
  value: string;
  onChange: (slug: string) => void;
}

const templatePreviewColors: Record<string, { primary: string; accent: string; bg: string }> = {
  classic: { primary: '#1a1a2e', accent: '#e94560', bg: 'from-slate-800 to-rose-500' },
  modern: { primary: '#6366f1', accent: '#818cf8', bg: 'from-indigo-500 to-indigo-300' },
  minimal: { primary: '#111827', accent: '#6b7280', bg: 'from-gray-900 to-gray-400' },
  professional: { primary: '#0f172a', accent: '#0ea5e9', bg: 'from-slate-900 to-sky-500' },
  elegant: { primary: '#7c3aed', accent: '#a78bfa', bg: 'from-violet-600 to-violet-300' },
};

function TemplateCard({
  template,
  isSelected,
  isLocked,
  onSelect,
}: {
  template: IInvoiceTemplate;
  isSelected: boolean;
  isLocked: boolean;
  onSelect: () => void;
}) {
  const colors = templatePreviewColors[template.slug] || templatePreviewColors.classic;

  return (
    <button
      type="button"
      onClick={() => !isLocked && onSelect()}
      disabled={isLocked}
      className={cn(
        'relative group flex flex-col rounded-xl border-2 transition-all duration-200 overflow-hidden',
        isSelected
          ? 'border-amber-400 ring-2 ring-amber-200 shadow-lg shadow-amber-100'
          : isLocked
          ? 'border-gray-100 opacity-60 cursor-not-allowed'
          : 'border-gray-200 hover:border-amber-300 hover:shadow-md cursor-pointer'
      )}
    >
      {/* Template visual preview */}
      <div className={cn('h-24 bg-gradient-to-br', colors.bg, 'relative p-3')}>
        {/* Mini invoice layout */}
        <div className="bg-white/90 rounded-sm p-2 h-full flex flex-col gap-1">
          <div className="flex justify-between items-start">
            <div className="w-8 h-1.5 rounded-sm" style={{ backgroundColor: colors.primary }} />
            <div className="w-6 h-1 rounded-sm" style={{ backgroundColor: colors.accent }} />
          </div>
          <div className="flex-1 space-y-0.5">
            <div className="w-full h-0.5 bg-gray-200 rounded" />
            <div className="w-3/4 h-0.5 bg-gray-200 rounded" />
            <div className="w-5/6 h-0.5 bg-gray-100 rounded" />
          </div>
          <div className="flex justify-end">
            <div className="w-8 h-2 rounded-sm" style={{ backgroundColor: colors.accent }} />
          </div>
        </div>

        {/* Status overlays */}
        {isSelected && (
          <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center">
            <Check size={12} className="text-white" />
          </div>
        )}
        {isLocked && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <div className="bg-white/90 rounded-full p-1.5">
              <Lock size={14} className="text-gray-600" />
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2.5 text-left">
        <p className="text-xs font-semibold text-gray-900">{template.name}</p>
        <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">{template.description}</p>
        {template.isPremium && (
          <span className="inline-block mt-1 text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700">
            Premium
          </span>
        )}
      </div>
    </button>
  );
}

export function TemplateSelector({ value, onChange }: TemplateSelectorProps) {
  const { activeBusiness } = useAuth();
  const { templates, builtIn, plan, loading, fetchTemplates, setSelectedTemplate } = useTemplateStore();

  useEffect(() => {
    if (activeBusiness?.id) {
      fetchTemplates(activeBusiness.id);
    }
  }, [activeBusiness?.id, fetchTemplates]);

  const handleSelect = (slug: string) => {
    setSelectedTemplate(slug);
    onChange(slug);
  };

  const getIsLocked = (template: IInvoiceTemplate) => {
    if (!template.isPremium) return false;
    return plan === SubscriptionPlan.Free || plan === SubscriptionPlan.Starter;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Palette size={16} /> Invoice Template
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
        <Palette size={16} /> Invoice Template
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {builtIn.map((template) => (
          <TemplateCard
            key={template.slug}
            template={template}
            isSelected={value === template.slug}
            isLocked={getIsLocked(template)}
            onSelect={() => handleSelect(template.slug)}
          />
        ))}
      </div>
      {builtIn.some((t) => t.isPremium) && (plan === SubscriptionPlan.Free || plan === SubscriptionPlan.Starter) && (
        <div className="flex items-center gap-2 p-2.5 bg-amber-50 rounded-lg border border-amber-100">
          <Lock size={14} className="text-amber-600 shrink-0" />
          <p className="text-xs text-amber-700">
            Upgrade to <strong>Professional</strong> or <strong>Business</strong> to unlock premium templates.
          </p>
        </div>
      )}
    </div>
  );
}
