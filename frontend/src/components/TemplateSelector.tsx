'use client';

import { useEffect, useState } from 'react';
import { Check, Lock, Palette, Search } from 'lucide-react';
import { IInvoiceTemplate, SubscriptionPlan } from '@/types';
import { useTemplateStore } from '@/stores/templateStore';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

// Color pairs for each template preview
const TEMPLATE_COLORS: Record<string, { primary: string; accent: string }> = {
  classic:         { primary: '#1a1a2e', accent: '#e94560' },
  modern:          { primary: '#6366f1', accent: '#818cf8' },
  minimal:         { primary: '#111827', accent: '#6b7280' },
  professional:    { primary: '#0f172a', accent: '#0ea5e9' },
  elegant:         { primary: '#7c3aed', accent: '#a78bfa' },
  bold:            { primary: '#000000', accent: '#f59e0b' },
  'gradient-blue': { primary: '#2563eb', accent: '#3b82f6' },
  'forest-green':  { primary: '#166534', accent: '#22c55e' },
  'sunset-orange': { primary: '#ea580c', accent: '#fb923c' },
  'rose-gold':     { primary: '#9f1239', accent: '#fb7185' },
  'tech-cyan':     { primary: '#0e7490', accent: '#22d3ee' },
  'arctic-white':  { primary: '#1e40af', accent: '#93c5fd' },
  'midnight-purple': { primary: '#3b0764', accent: '#d97706' },
  'coral-reef':    { primary: '#0d9488', accent: '#f472b6' },
  'slate-pro':     { primary: '#334155', accent: '#475569' },
  espresso:        { primary: '#78350f', accent: '#d97706' },
  'neon-edge':     { primary: '#18181b', accent: '#a3e635' },
  'ocean-breeze':  { primary: '#0369a1', accent: '#67e8f9' },
  'cherry-blossom': { primary: '#be185d', accent: '#fda4af' },
  gunmetal:        { primary: '#1c1917', accent: '#b45309' },
  'lavender-dreams': { primary: '#6d28d9', accent: '#c4b5fd' },
  monochrome:      { primary: '#000000', accent: '#525252' },
};

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'standard', label: 'Standard' },
  { key: 'minimal', label: 'Minimal' },
  { key: 'corporate', label: 'Corporate' },
  { key: 'creative', label: 'Creative' },
  { key: 'bold', label: 'Bold' },
  { key: 'warm', label: 'Warm' },
  { key: 'luxury', label: 'Luxury' },
  { key: 'tech', label: 'Tech' },
  { key: 'clean', label: 'Clean' },
  { key: 'executive', label: 'Executive' },
  { key: 'vibrant', label: 'Vibrant' },
  { key: 'startup', label: 'Startup' },
  { key: 'calm', label: 'Calm' },
  { key: 'industrial', label: 'Industrial' },
  { key: 'wellness', label: 'Wellness' },
  { key: 'nature', label: 'Nature' },
  { key: 'gradient', label: 'Gradient' },
];

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
  const colors = TEMPLATE_COLORS[template.slug] || { primary: '#333', accent: '#999' };

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
          ? 'border-gray-100 opacity-50 cursor-not-allowed'
          : 'border-gray-200 hover:border-amber-300 hover:shadow-md cursor-pointer'
      )}
    >
      {/* Visual preview */}
      <div
        className="h-20 relative p-2.5"
        style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})` }}
      >
        <div className="bg-white/90 rounded-sm p-1.5 h-full flex flex-col gap-0.5">
          <div className="flex justify-between items-start">
            <div className="w-6 h-1 rounded-sm" style={{ backgroundColor: colors.primary }} />
            <div className="w-4 h-0.5 rounded-sm" style={{ backgroundColor: colors.accent }} />
          </div>
          <div className="flex-1 space-y-px">
            <div className="w-full h-px bg-gray-200" />
            <div className="w-3/4 h-px bg-gray-200" />
            <div className="w-5/6 h-px bg-gray-100" />
          </div>
          <div className="flex justify-end">
            <div className="w-5 h-1.5 rounded-sm" style={{ backgroundColor: colors.accent }} />
          </div>
        </div>

        {isSelected && (
          <div className="absolute top-1 right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center">
            <Check size={10} className="text-white" strokeWidth={3} />
          </div>
        )}
        {isLocked && (
          <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
            <div className="bg-white/90 rounded-full p-1">
              <Lock size={12} className="text-gray-600" />
            </div>
          </div>
        )}
      </div>

      <div className="p-2 text-left">
        <p className="text-[11px] font-semibold text-gray-900 leading-tight">{template.name}</p>
        {template.isPremium && (
          <span className="inline-block mt-0.5 text-[8px] font-semibold px-1 py-px rounded bg-amber-50 text-amber-700">
            PRO
          </span>
        )}
      </div>
    </button>
  );
}

export function TemplateSelector({ value, onChange }: { value: string; onChange: (slug: string) => void }) {
  const { activeBusiness } = useAuth();
  const { templates, builtIn, plan, loading, fetchTemplates, setSelectedTemplate } = useTemplateStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    if (activeBusiness?.id) fetchTemplates(activeBusiness.id);
  }, [activeBusiness?.id, fetchTemplates]);

  const handleSelect = (slug: string) => {
    setSelectedTemplate(slug);
    onChange(slug);
  };

  const getIsLocked = (template: IInvoiceTemplate) => {
    if (!template.isPremium) return false;
    const tier = (template as any).tier;
    if (!tier) return false;
    if (plan === SubscriptionPlan.Free) return tier === 'starter' || tier === 'professional' || tier === 'business';
    if (plan === SubscriptionPlan.Starter) return tier === 'professional' || tier === 'business';
    if (plan === SubscriptionPlan.Professional) return tier === 'business';
    return false;
  };

  const filteredTemplates = builtIn.filter((t) => {
    const matchesSearch = !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || (t.layout as any).category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const lockedCount = builtIn.filter(getIsLocked).length;

  if (loading) {
    return (
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Palette size={16} /> Invoice Template
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Palette size={16} /> Invoice Template
          <span className="text-xs text-gray-400 font-normal">({builtIn.length} available)</span>
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-amber-300"
        />
      </div>

      {/* Category filter */}
      <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={cn(
              'px-2 py-0.5 text-[10px] font-medium rounded-full whitespace-nowrap transition',
              activeCategory === cat.key
                ? 'bg-amber-100 text-amber-700'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Template grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
        {filteredTemplates.map((template) => (
          <TemplateCard
            key={template.slug}
            template={template}
            isSelected={value === template.slug}
            isLocked={getIsLocked(template)}
            onSelect={() => handleSelect(template.slug)}
          />
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-4">No templates match your search.</p>
      )}

      {lockedCount > 0 && (
        <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg border border-amber-100">
          <Lock size={12} className="text-amber-600 shrink-0" />
          <p className="text-[11px] text-amber-700">
            {lockedCount} premium template{lockedCount > 1 ? 's' : ''} available. Upgrade to unlock more.
          </p>
        </div>
      )}
    </div>
  );
}
