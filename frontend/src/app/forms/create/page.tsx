"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";
import { Save, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CreateFormPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  /** Create a new empty form and redirect to its detail page */
  const handleCreate = async () => {
    if (!name.trim()) return toast.error("Form name is required");
    setLoading(true);
    try {
      const form = await api.forms.create({ name, slug: slug || name.toLowerCase().replace(/\s+/g, "-"), description, fields: [] });
      toast.success("Form created!");
      router.push(`/forms/${form.id}`);
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background"><div className="container flex h-16 items-center"><Link href="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4"/> Back to Dashboard</Link></div></header>
      <main className="container py-8 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">Create New Form</h1>
        <div className="space-y-4 rounded-lg border bg-card p-6">
          <div><label className="text-sm font-medium mb-1 block">Form Name</label><Input placeholder="Contact Form" value={name} onChange={e => setName(e.target.value)} /></div>
          <div><label className="text-sm font-medium mb-1 block">Slug (optional)</label><Input placeholder="contact-form" value={slug} onChange={e => setSlug(e.target.value)} /><p className="text-xs text-muted-foreground mt-1">Your form will be at /api/v1/submissions/{slug || "your-slug"}</p></div>
          <div><label className="text-sm font-medium mb-1 block">Description (optional)</label><Input placeholder="A brief description" value={description} onChange={e => setDescription(e.target.value)} /></div>
          <Button onClick={handleCreate} disabled={loading || !name.trim()}><Save className="h-4 w-4 mr-2"/>{loading ? "Creating..." : "Create Form"}</Button>
        </div>
      </main>
    </div>
  );
}
