"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/context/auth-context";
import { Key, Bell, Shield, Palette } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [apiKey, setApiKey] = useState(user?.apiKey || "");
  const [regenerating, setRegenerating] = useState(false);

  const regenerateKey = async () => {
    setRegenerating(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/regenerate-key`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` } });
      const data = await res.json();
      if (data.success) { setApiKey(data.data.apiKey); toast.success("API key regenerated!"); }
    } catch { toast.error("Failed to regenerate key"); }
    finally { setRegenerating(false); }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background"><div className="container flex h-16 items-center"><h1 className="text-xl font-bold">Settings</h1></div></header>
      <main className="container py-8 max-w-2xl space-y-6">
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><Key className="h-5 w-5"/> API Key</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2"><Input value={apiKey} readOnly type="password" /><Button variant="outline" onClick={() => { navigator.clipboard.writeText(apiKey); toast.success("Copied!"); }}>Copy</Button></div>
            <Button variant="destructive" size="sm" onClick={regenerateKey} disabled={regenerating}>{regenerating ? "Regenerating..." : "Regenerate Key"}</Button>
          </CardContent>
        </Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5"/> Plan</CardTitle></CardHeader>
          <CardContent><div className="flex items-center justify-between"><div><p className="font-semibold capitalize">{user?.plan}</p><p className="text-sm text-muted-foreground">{user?.formLimit} forms limit</p></div><Badge>{user?.plan}</Badge></div></CardContent>
        </Card>
      </main>
    </div>
  );
}
