'use client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Plus, Loader2, Mail, Shield, Trash2, Users } from 'lucide-react';
import { inviteSchema, InviteFormData } from '@/lib/validations';
import { ITeamMember, IInvitation, TeamRole } from '@/types';
import { formatDate, getPlanColor } from '@/lib/utils';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

const ROLE_DESCRIPTIONS: Record<string, string> = {
  Owner: 'Full access to everything',
  Admin: 'Manage team, invoices, and settings',
  Accountant: 'Manage invoices, payments, and reports',
  Manager: 'Create and manage invoices',
  Employee: 'View and create invoices',
  Viewer: 'Read-only access',
};

export default function TeamPage() {
  const [members, setMembers] = useState<ITeamMember[]>([]);
  const [invitations, setInvitations] = useState<IInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);

  const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: '', role: TeamRole.Employee },
  });

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const [membersRes, invitesRes] = await Promise.all([
        api.get('/team'),
        api.get('/team/invitations'),
      ]);
      if (membersRes.data.success && membersRes.data.data) setMembers(membersRes.data.data as ITeamMember[]);
      if (invitesRes.data.success && invitesRes.data.data) setInvitations(invitesRes.data.data as IInvitation[]);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => { fetchTeam(); }, []);

  const onInvite = async (data: InviteFormData) => {
    try {
      await api.post('/team/invite', data);
      toast.success('Invitation sent!');
      reset();
      setShowInvite(false);
      fetchTeam();
    } catch (error: unknown) { toast.error(error instanceof Error ? error.message : 'Failed'); }
  };

  const handleRemoveMember = async (id: string) => {
    if (!confirm('Remove this team member?')) return;
    try { await api.delete(`/team/${id}`); toast.success('Removed'); fetchTeam(); }
    catch { toast.error('Failed'); }
  };

  const handleCancelInvite = async (id: string) => {
    if (!confirm('Cancel this invitation?')) return;
    try { await api.delete(`/team/invitations/${id}`); toast.success('Cancelled'); fetchTeam(); }
    catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900">Team Management</h1><p className="text-gray-500">Invite and manage team members</p></div>
        <Button onClick={() => setShowInvite(!showInvite)}><Plus size={18} className="mr-2" /> Invite Member</Button>
      </div>

      {showInvite && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Mail size={18} /> Invite Team Member</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onInvite)} className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" placeholder="colleague@company.com" {...register('email')} />
                {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Role *</Label>
                <Select onValueChange={(v) => setValue('role', v as TeamRole, { shouldValidate: true })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.values(TeamRole).filter(r => r !== TeamRole.Owner).map((role) => (
                      <SelectItem key={role} value={role}>{role} — {ROLE_DESCRIPTIONS[role]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.role && <p className="text-red-500 text-sm">{errors.role.message}</p>}
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 size={16} className="animate-spin mr-2" />Sending...</> : 'Send Invite'}
                </Button>
                <Button type="button" variant="outline" onClick={() => { setShowInvite(false); reset(); }}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Team Members */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Users size={18} /> Team Members ({members.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div> :
            members.length > 0 ? (
              <Table>
                <TableHeader><TableRow><TableHead>Member</TableHead><TableHead>Role</TableHead><TableHead>Joined</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {members.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-semibold text-sm">
                            {m.user?.fullName?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{m.user?.fullName || 'Unknown'}</p>
                            <p className="text-xs text-gray-500">{m.user?.email || '—'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getPlanColor(m.role)}`}>{m.role}</span>
                      </TableCell>
                      <TableCell className="text-gray-500 text-sm">{formatDate(m.joinedAt)}</TableCell>
                      <TableCell className="text-right">
                        {m.role !== TeamRole.Owner && (
                          <Button variant="ghost" size="sm" onClick={() => handleRemoveMember(m.id)} className="text-red-500 hover:text-red-600">
                            <Trash2 size={14} className="mr-1" /> Remove
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : <p className="text-gray-400 text-sm py-8 text-center">No team members yet</p>}
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Mail size={18} /> Pending Invitations ({invitations.length})</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Sent</TableHead><TableHead>Expires</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {invitations.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.email}</TableCell>
                    <TableCell><span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700`}>{inv.role}</span></TableCell>
                    <TableCell className="text-gray-500 text-sm">{formatDate(inv.createdAt)}</TableCell>
                    <TableCell className="text-gray-500 text-sm">{formatDate(inv.expiresAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleCancelInvite(inv.id)} className="text-red-500 hover:text-red-600">
                        <Trash2 size={14} className="mr-1" /> Cancel
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
