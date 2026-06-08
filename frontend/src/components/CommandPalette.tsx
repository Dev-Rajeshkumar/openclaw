'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, FileText, Users, Receipt, BarChart3, Settings, Plus, Building2, CreditCard, Repeat, ClipboardList, Bell, UserCog, Package } from 'lucide-react';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from '@/components/ui/command';

interface CommandItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  action?: () => void;
  shortcut?: string;
  group: string;
}

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const commands: CommandItem[] = [
    { label: 'New Invoice', href: '/dashboard/invoices/new', icon: <Plus size={16} />, shortcut: '⌘I', group: 'Create' },
    { label: 'New Client', href: '/dashboard/clients/new', icon: <Plus size={16} />, shortcut: '⌘C', group: 'Create' },
    { label: 'New Estimate', href: '/dashboard/estimates/new', icon: <Plus size={16} />, group: 'Create' },
    { label: 'New Expense', href: '/dashboard/expenses/new', icon: <Plus size={16} />, group: 'Create' },
    { label: 'Dashboard', href: '/dashboard', icon: <BarChart3 size={16} />, group: 'Navigate' },
    { label: 'Invoices', href: '/dashboard/invoices', icon: <FileText size={16} />, group: 'Navigate' },
    { label: 'Clients', href: '/dashboard/clients', icon: <Users size={16} />, group: 'Navigate' },
    { label: 'Estimates', href: '/dashboard/estimates', icon: <ClipboardList size={16} />, group: 'Navigate' },
    { label: 'Payments', href: '/dashboard/payments', icon: <CreditCard size={16} />, group: 'Navigate' },
    { label: 'Expenses', href: '/dashboard/expenses', icon: <Receipt size={16} />, group: 'Navigate' },
    { label: 'Recurring', href: '/dashboard/recurring', icon: <Repeat size={16} />, group: 'Navigate' },
    { label: 'Products', href: '/dashboard/products', icon: <Package size={16} />, group: 'Navigate' },
    { label: 'Reports', href: '/dashboard/reports', icon: <BarChart3 size={16} />, group: 'Navigate' },
    { label: 'Activity Log', href: '/dashboard/activity', icon: <FileText size={16} />, group: 'Navigate' },
    { label: 'Notifications', href: '/dashboard/notifications', icon: <Bell size={16} />, group: 'Navigate' },
    { label: 'Team', href: '/dashboard/team', icon: <UserCog size={16} />, group: 'Navigate' },
    { label: 'Files', href: '/dashboard/files', icon: <FileText size={16} />, group: 'Navigate' },
    { label: 'Settings', href: '/dashboard/settings', icon: <Settings size={16} />, group: 'Navigate' },
  ];

  const runCommand = useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-400 hover:bg-gray-100 transition w-full sm:w-64"
      >
        <Search size={14} />
        <span className="flex-1 text-left">Search...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-gray-200 bg-white text-xs font-mono text-gray-400">⌘K</kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {['Create', 'Navigate'].map((group) => (
            <CommandGroup key={group} heading={group}>
              {commands.filter((c) => c.group === group).map((command) => (
                <CommandItem
                  key={command.label}
                  onSelect={() => {
                    if (command.href) runCommand(() => router.push(command.href!));
                    else if (command.action) runCommand(command.action);
                  }}
                >
                  {command.icon}
                  <span>{command.label}</span>
                  {command.shortcut && <CommandShortcut>{command.shortcut}</CommandShortcut>}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
