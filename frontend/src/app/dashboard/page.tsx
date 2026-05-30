"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import { useAuth } from "@/context/auth-context";
import { Form } from "@/types";
import { Plus, FileText, Trash2, Eye, Copy, Zap, ExternalLink, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && !user) { router.push("/auth/login"); return; }
    if (user) {
      api.forms.list().then(setForms).catch(() => {}).finally(() => setLoading(false));
      api.activity.getUnread().then(setAlerts).catch(() => {});
    }
  }, [user, authLoading, router]);

  const createForm = async () => {
    if (!newName) return;
    try {
      const form = await api.forms.create({ name: newName, slug: newSlug || newName.toLowerCase().replace(/\s+/g, "-"), fields: [] });
      toast.success("Form created!");
      setForms([form, ...forms]);
      setShowCreate(false); setNewName(""); setNewSlug("");
    } catch (err: any) { toast.error(err.message); }
  };

  const deleteForm = async (id: string) => {
    if (!confirm("Delete this form?")) return;
    await api.forms.delete(id);
    setForms(forms.filter(f => f.id !== id));
    toast.success("Form deleted");
  };

  const copyEmbed = (slug: string) => {
    const code = `<form action="${process.env.NEXT_PUBLIC_APP_URL || "https://formflow.app"}/api/v1/submissions/${slug}" method="POST">\n  <input type="text" name="name" placeholder="Your Name" required />\n  <input type="email" name="email" placeholder="Your Email" required />\n  <button type="submit">Send</button>\n</form>`;
    navigator.clipboard.writeText(code);
    toast.success("Embed code copied!");
  };

  if (authLoading || loading) return <div className="flex min-h-screen items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"/></div>;

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background"><div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2"><div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center"><Zap className="h-5 w-5 text-primary-foreground"/></div><span className="text-xl font-bold">FormFlow</span></Link>
        <div className="flex items-center gap-3">
          {alerts.length > 0 && <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3"/>{alerts.length} alert{alerts.length > 1 ? "s" : ""}</Badge>}
          <span className="text-sm text-muted-foreground">{user?.email}</span>
          <Button variant="ghost" size="sm" onClick={() => { localStorage.removeItem("token"); router.push("/"); }}>Sign Out</Button>
        </div>
      </div></header>

      <main className="container py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total Forms</p><p className="text-3xl font-bold">{forms.length}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Submissions</p><p className="text-3xl font-bold">{forms.reduce((a, f) => a + (f._count?.submissions || 0), 0)}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Active Forms</p><p className="text-3xl font-bold">{forms.filter(f => f.isActive).length}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Plan</p><p className="text-3xl font-bold capitalize">{user?.plan?.toLowerCase()}</p></CardContent></Card>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Your Forms</h1>
          <div className="flex gap-2">
            <Link href="/forms/ai-builder"><Button variant="outline" className="gap-2"><Zap className="h-4 w-4"/> AI Builder</Button></Link>
            <Dialog open={showCreate} onOpenChange={setShowCreate}><DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4"/> New Form</Button></DialogTrigger>
              <DialogContent><DialogHeader><DialogTitle>Create New Form</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-4">
                  <Input placeholder="Form Name" value={newName} onChange={e => setNewName(e.target.value)} />
                  <Input placeholder="Slug (optional)" value={newSlug} onChange={e => setNewSlug(e.target.value)} />
                  <Button className="w-full" onClick={createForm}>Create Form</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Forms list */}
        {forms.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed rounded-lg">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4"/>
            <h3 className="text-lg font-semibold mb-2">No forms yet</h3>
            <p className="text-muted-foreground mb-4">Create your first form or use AI to generate one</p>
            <div className="flex gap-2 justify-center"><Link href="/forms/ai-builder"><Button><Zap className="h-4 w-4 mr-2"/>AI Builder</Button></Link><Button variant="outline" onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-2"/>Create Manually</Button></div>
          </div>
        ) : (
          <div className="space-y-4">
            {forms.map(form => (
              <Card key={form.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div><h3 className="font-semibold text-lg">{form.name}</h3><p className="text-sm text-muted-foreground">/api/v1/submissions/{form.slug} • {form._count?.submissions || 0} submissions • <Badge variant={form.isActive?"default":"secondary"} className="text-xs">{form.isActive?"Active":"Paused"}</Badge></p></div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => copyEmbed(form.slug)}><Copy className="h-3.5 w-3.5"/></Button>
                    <Link href={`/forms/${form.id}`}><Button variant="outline" size="sm"><Eye className="h-3.5 w-3.5"/></Button></Link>
                    <Button variant="ghost" size="sm" onClick={() => deleteForm(form.id)}><Trash2 className="h-3.5 w-3.5 text-destructive"/></Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
