'use client';

import { create } from 'zustand';
import { IInvoiceTemplate } from '@/types';
import api from '@/lib/api';

interface TemplateState {
  templates: IInvoiceTemplate[];
  builtIn: IInvoiceTemplate[];
  custom: IInvoiceTemplate[];
  selectedTemplate: string;
  plan: string;
  loading: boolean;
  fetchTemplates: (businessId: string) => Promise<void>;
  setSelectedTemplate: (slug: string) => void;
}

export const useTemplateStore = create<TemplateState>((set) => ({
  templates: [],
  builtIn: [],
  custom: [],
  selectedTemplate: 'classic',
  plan: 'Free',
  loading: false,

  fetchTemplates: async (businessId: string) => {
    set({ loading: true });
    try {
      const { data } = await api.get(`/businesses/${businessId}/invoice-templates`);
      if (data.success && data.data) {
        const all = [...data.data.builtIn, ...data.data.custom];
        set({
          builtIn: data.data.builtIn,
          custom: data.data.custom,
          templates: all,
          plan: data.data.plan,
          loading: false,
        });
      }
    } catch {
      set({ loading: false });
    }
  },

  setSelectedTemplate: (slug: string) => set({ selectedTemplate: slug }),
}));
