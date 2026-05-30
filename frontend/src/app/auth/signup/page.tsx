"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";
import { Zap } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const res = await api.auth.signup({ email, name });
      login(res.token, res.user);
      toast.success("Account created!");
      router.push("/dashboard");
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-6"><div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center"><Zap className="h-5 w-5 text-primary-foreground"/></div><span className="text-xl font-bold">FormFlow</span></Link>
          <h1 className="text-2xl font-bold">Create your free account</h1>
          <p className="text-muted-foreground mt-2">Start building forms in seconds</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} required />
          <Input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
          <Button type="submit" className="w-full" disabled={loading}>{loading ? "Creating..." : "Create Account"}</Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">Already have an account? <Link href="/auth/login" className="text-primary hover:underline">Sign in</Link></p>
      </div>
    </div>
  );
}
