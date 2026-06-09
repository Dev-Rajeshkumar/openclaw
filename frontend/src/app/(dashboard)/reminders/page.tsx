'use client';

import { useEffect, useState, useCallback } from 'react';
import { BellRing, Mail, MessageCircle, Save, Send, Clock, CheckCircle, XCircle, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { INotification } from '@/types';
import { formatDate } from '@/lib/utils';

interface ReminderSchedule {
  id: string;
  name: string;
  daysBefore: number;
  onDueDate: boolean;
  daysAfter: number[];
  emailEnabled: boolean;
  whatsappEnabled: boolean;
}

const DEFAULT_SCHEDULE: ReminderSchedule = {
  id: '',
  name: 'Default',
  daysBefore: 3,
  onDueDate: true,
  daysAfter: [7, 14, 30],
  emailEnabled: true,
  whatsappEnabled: false,
};

const AFTER_OPTIONS = [3, 7, 14, 30, 45, 60];

export default function RemindersPage() {
  const [schedule, setSchedule] = useState<ReminderSchedule>(DEFAULT_SCHEDULE);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<INotification[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const fetchSchedule = useCallback(async () => {
    try {
      const { data } = await api.get('/reminder-schedule');
      if (data.success && data.data) {
        setSchedule({ ...DEFAULT_SCHEDULE, ...data.data });
      }
    } catch {
      // Use defaults if no schedule exists yet
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications?limit=50');
      if (data.success && data.data) {
        // Filter to reminder-type notifications
        const reminders = (data.data as INotification[]).filter((n) => n.type === 'Reminder');
        setHistory(reminders);
      }
    } catch {
      // ignore
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedule();
    fetchHistory();
  }, [fetchSchedule, fetchHistory]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/reminder-schedule', {
        daysBefore: schedule.daysBefore,
        onDueDate: schedule.onDueDate,
        daysAfter: schedule.daysAfter,
        emailEnabled: schedule.emailEnabled,
        whatsappEnabled: schedule.whatsappEnabled,
      });
      toast.success('Reminder schedule saved!');
    } catch {
      toast.error('Failed to save reminder schedule');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAfterDay = (day: number) => {
    setSchedule((prev) => ({
      ...prev,
      daysAfter: prev.daysAfter.includes(day)
        ? prev.daysAfter.filter((d) => d !== day)
        : [...prev.daysAfter, day].sort((a, b) => a - b),
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <BellRing size={24} className="text-amber-500" /> Reminder Settings
        </h1>
        <p className="text-gray-500 dark:text-gray-400">Configure automated payment reminders for your clients</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Schedule Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Settings2 size={18} /> Reminder Schedule</CardTitle>
            <CardDescription>When should reminders be sent?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Days Before */}
            <div className="space-y-2">
              <Label>Days before due date</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={0}
                  max={30}
                  value={schedule.daysBefore}
                  onChange={(e) => setSchedule({ ...schedule, daysBefore: parseInt(e.target.value) || 0 })}
                  className="w-24"
                />
                <span className="text-sm text-gray-500 dark:text-gray-400">days before due date</span>
              </div>
            </div>

            {/* On Due Date */}
            <div className="flex items-center justify-between">
              <div>
                <Label>On due date</Label>
                <p className="text-xs text-gray-400 dark:text-gray-500">Send reminder on the due date itself</p>
              </div>
              <Switch
                checked={schedule.onDueDate}
                onCheckedChange={(v) => setSchedule({ ...schedule, onDueDate: v })}
              />
            </div>

            {/* Days After */}
            <div className="space-y-2">
              <Label>Days after due date (overdue)</Label>
              <div className="flex flex-wrap gap-2">
                {AFTER_OPTIONS.map((day) => (
                  <button
                    key={day}
                    onClick={() => handleToggleAfterDay(day)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                      schedule.daysAfter.includes(day)
                        ? 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900 dark:text-amber-300 dark:border-amber-700'
                        : 'bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
                    }`}
                  >
                    +{day} days
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-700 pt-4 space-y-4">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Channels</h4>

              {/* Email Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-gray-400" />
                  <div>
                    <Label className="text-sm">Email Reminders</Label>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Send via configured SMTP</p>
                  </div>
                </div>
                <Switch
                  checked={schedule.emailEnabled}
                  onCheckedChange={(v) => setSchedule({ ...schedule, emailEnabled: v })}
                />
              </div>

              {/* WhatsApp Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle size={16} className="text-green-500" />
                  <div>
                    <Label className="text-sm">WhatsApp Reminders</Label>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Open WhatsApp with pre-filled message</p>
                  </div>
                </div>
                <Switch
                  checked={schedule.whatsappEnabled}
                  onCheckedChange={(v) => setSchedule({ ...schedule, whatsappEnabled: v })}
                />
              </div>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? (
                <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" /> Saving...</>
              ) : (
                <><Save size={16} className="mr-2" /> Save Schedule</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Reminder History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Clock size={18} /> Reminder History</CardTitle>
            <CardDescription>Recently sent reminders</CardDescription>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500" />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                <BellRing size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No reminders sent yet</p>
                <p className="text-xs">Reminders will appear here once sent</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {history.map((notif) => (
                  <div key={notif.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      notif.isRead ? 'bg-green-50 dark:bg-green-900/30' : 'bg-amber-50 dark:bg-amber-900/30'
                    }`}>
                      {notif.isRead ? (
                        <CheckCircle size={14} className="text-green-600" />
                      ) : (
                        <XCircle size={14} className="text-amber-600" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{notif.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{notif.message}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{formatDate(notif.createdAt)}</p>
                    </div>
                    <Badge className={`shrink-0 text-xs ${
                      notif.type === 'Reminder' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                      'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {notif.type}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Send size={18} className="text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">How reminders work</p>
              <ul className="text-xs text-amber-700 dark:text-amber-300 mt-1 space-y-1">
                <li>• Email reminders are sent automatically based on your schedule</li>
                <li>• WhatsApp reminders open a pre-filled message — client must have a phone number</li>
                <li>• Reminders are sent for invoices with status &quot;Sent&quot; or &quot;Overdue&quot;</li>
                <li>• Each invoice is reminded only once per scheduled interval</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
