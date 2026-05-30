"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api/client";
import { useAuth } from "@/context/auth-context";
import { Form, Submission, Webhook, Integration } from "@/types";
import { ArrowLeft, Download, Trash2, Copy, Webhook as WebhookIcon, Plug, CreditCard, Brain, Shield } from "lucide-react";
import { toast } from "sonner";

export default function FormDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const [form, setForm] = useState<Form | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWebhookDialog, setShowWebhookDialog] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");

  useEffect(() => {
    if (user) {
      Promise.all([
        api.forms.get(params.id).then(f => { setForm(f); setWebhooks(f.webhooks || []); setIntegrations(f.integrations || []); }),
        api.submissions.getByForm(params.id).then(r => setSubmissions(r.data || r.submissions || [])),
      ]).catch(() => {}).finally(() => setLoading(false));
    }
  }, [user, params.id]);

  useEffect(() => { if (user) api.integrations.getByForm(params.id).then(setIntegrations).catch(() => {}); }, [user, params.id]);

  const addWebhook = async () => {
    if (!webhookUrl) return;
    try {
      const wh = await api.webhooks.create(params.id, { url: webhookUrl, events: ["form.submitted"] });
      setWebhooks([...webhooks, wh]);
      setShowWebhookDialog(false); setWebhookUrl("");
      toast.success("Webhook added!");
    } catch (err: any) { toast.error(err.message); }
  };

  const addIntegration = async (type: string) => {
    try {
      const int = await api.integrations.create(params.id, { type, config: {} });
      setIntegrations([...integrations, int]);
      toast.success(`${type} integration added!`);
    } catch (err: any) { toast.error(err.message); }
  };

  const createStripeCheckout = async () => {
    try {
      const result = await api.payments.checkout(params.id, { amount: 5000, successUrl: `${window.location.origin}/forms/${params.id}?success=true`, cancelUrl: `${window.location.origin}/forms/${params.id}` });
      if (result.url) window.location.href = result.url;
    } catch (err: any) { toast.error(err.message); }
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"/></div>;
  if (!form) return <div className="container py-20 text-center"><h2 className="text-xl font-semibold">Form not found</h2><Link href="/dashboard"><Button className="mt-4">Back to Dashboard</Button></Link></div>;

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background"><div className="container flex h-16 items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4"/> Back to Dashboard</Link>
        <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => api.submissions.exportCSV(params.id)}><Download className="h-4 w-4 mr-2"/>Export CSV</Button><Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_APP_URL}/api/v1/submissions/${form.slug}`); toast.success("API URL copied!"); }}><Copy className="h-4 w-4 mr-2"/>Copy API URL</Button></div>
      </div></header>

      <main className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div><h1 className="text-2xl font-bold">{form.name}</h1><p className="text-muted-foreground">{form.slug} • {form.submitCount} submissions • <Badge variant={form.isActive?"default":"secondary"}>{form.isActive?"Active":"Paused"}</Badge></p></div>
        </div>

        <Tabs defaultValue="submissions" className="space-y-6">
          <TabsList><TabsTrigger value="submissions">Submissions</TabsTrigger><TabsTrigger value="webhooks">Webhooks</TabsTrigger><TabsTrigger value="integrations">Integrations</TabsTrigger><TabsTrigger value="payments">Payments</TabsTrigger><TabsTrigger value="settings">Settings</TabsTrigger></TabsList>

          <TabsContent value="submissions">
            {submissions.length === 0 ? <div className="text-center py-16 border-2 border-dashed rounded-lg"><p className="text-muted-foreground">No submissions yet.</p></div> : (
              <div className="space-y-4">{submissions.map(sub => (
                <Card key={sub.id} className="p-6">
                  <div className="flex items-start justify-between mb-3"><span className="text-xs text-muted-foreground">{new Date(sub.createdAt).toLocaleString()}</span>{sub.isSpam && <Badge variant="destructive">Spam</Badge>}</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{Object.entries(sub.data).map(([k, v]) => (<div key={k}><p className="text-xs font-medium text-muted-foreground uppercase">{k}</p><p className="text-sm mt-0.5">{v}</p></div>))}</div>
                </Card>
              ))}</div>
            )}
          </TabsContent>

          <TabsContent value="webhooks">
            <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-semibold flex items-center gap-2"><WebhookIcon className="h-5 w-5"/> Webhooks</h2><Button size="sm" onClick={() => setShowWebhookDialog(true)}>Add Webhook</Button></div>
            {showWebhookDialog && <Card className="p-4 mb-4"><div className="flex gap-2"><Input placeholder="https://your-server.com/webhook" value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} /><Button onClick={addWebhook}>Add</Button></div></Card>}
            {webhooks.length === 0 ? <div className="text-center py-12 border-2 border-dashed rounded-lg"><WebhookIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2"/><p className="text-muted-foreground">No webhooks configured</p></div> : (
              <div className="space-y-3">{webhooks.map(wh => <Card key={wh.id} className="p-4 flex items-center justify-between"><div><p className="font-mono text-sm">{wh.url}</p><p className="text-xs text-muted-foreground">{wh.events.join(", ")}</p></div><Button variant="ghost" size="sm" onClick={async () => { await api.webhooks.delete(params.id, wh.id); setWebhooks(webhooks.filter(w => w.id !== wh.id)); toast.success("Deleted"); }}><Trash2 className="h-3.5 w-3.5 text-destructive"/></Button></Card>)}</div>
            )}
          </TabsContent>

          <TabsContent value="integrations">
            <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-semibold flex items-center gap-2"><Plug className="h-5 w-5"/> Integrations</h2></div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {["zapier","make","google_sheets","slack","notion","airtable"].map(type => (
                <Card key={type} className="p-4 text-center hover:border-primary cursor-pointer" onClick={() => addIntegration(type)}>
                  <Plug className="h-8 w-8 mx-auto mb-2 text-muted-foreground"/><p className="text-sm font-medium capitalize">{type.replace("_", " ")}</p>
                </Card>
              ))}
            </div>
            {integrations.length > 0 && <div className="space-y-3">{integrations.map(int => (<Card key={int.id} className="p-4 flex items-center justify-between"><div><p className="font-medium capitalize">{int.type.replace("_", " ")}</p><Badge variant={int.isActive?"default":"secondary"}>{int.isActive?"Active":"Inactive"}</Badge></div><Button variant="ghost" size="sm" onClick={async () => { await api.integrations.delete(params.id, int.id); setIntegrations(integrations.filter(i => i.id !== int.id)); }}><Trash2 className="h-3.5 w-3.5 text-destructive"/></Button></Card>))}</div>}
          </TabsContent>

          <TabsContent value="payments">
            <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-semibold flex items-center gap-2"><CreditCard className="h-5 w-5"/> Stripe Payments</h2><Button size="sm" onClick={createStripeCheckout}>Create Checkout ($50)</Button></div>
            <Card className="p-6 text-center"><p className="text-muted-foreground">Connect Stripe to accept payments through your forms.</p><p className="text-sm mt-2">Set a fixed amount or let users enter a custom amount.</p></Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="p-6 space-y-6">
              <div><label className="text-sm font-medium">Form Name</label><Input defaultValue={form.name} className="mt-1"/></div>
              <div><label className="text-sm font-medium">Redirect URL (after submit)</label><Input placeholder="https://yoursite.com/thank-you" className="mt-1"/></div>
              <div className="flex items-center justify-between"><div><p className="text-sm font-medium">Honeypot Spam Protection</p><p className="text-xs text-muted-foreground">Invisible field that catches bots</p></div><Switch defaultChecked={form.honeypotEnabled}/></div>
              <div className="flex gap-2"><Button>Save Changes</Button><Button variant="destructive">Delete Form</Button></div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
