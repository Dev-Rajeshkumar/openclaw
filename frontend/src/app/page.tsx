import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Zap, Shield, Brain, CreditCard, Webhook, BarChart3 } from "lucide-react";

export default function LandingPage() {
  return (
      <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2"><div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center"><Zap className="h-5 w-5 text-primary-foreground"/></div><span className="text-xl font-bold">FormFlow</span></div>
          <nav className="flex items-center gap-4"><Link href="/auth/login"><Button variant="ghost">Login</Button></Link><Link href="/auth/signup"><Button>Get Started Free</Button></Link></nav>
        </div>
      </header>
      <section className="container flex flex-col items-center py-24 text-center">
        <div className="inline-flex items-center rounded-full border px-4 py-1.5 text-sm mb-6"><span className="mr-2">🚀</span>AI-Powered Form Building</div>
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl max-w-3xl">Build Forms with AI.<br/>Accept Payments.<br/>Automate Everything.</h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">The most powerful form backend. Describe what you need in plain English, and AI builds the complete form. Accept payments, connect integrations, prevent spam — all zero code.</p>
        <div className="mt-8 flex gap-4"><Link href="/auth/signup"><Button size="lg">Start Building Free</Button></Link><Link href="#features"><Button size="lg" variant="outline">See Features</Button></Link></div>
      </section>
      <section id="features" className="container py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Everything You Need</h2>
        <div className="grid gap-8 md:grid-cols-3">
          {[{icon:<Brain className="h-8 w-8"/>,title:"AI Form Builder",desc:"Describe your form in plain text. AI generates it instantly."},{icon:<Shield className="h-8 w-8"/>,title:"Advanced Spam Protection",desc:"Turnstile, honeypot, IP filtering — multi-layer security."},{icon:<CreditCard className="h-8 w-8"/>,title:"Accept Payments",desc:"Stripe integration for one-time and recurring payments."},{icon:<Webhook className="h-8 w-8"/>,title:"Webhooks & Integrations",desc:"Zapier, Make, Slack, Sheets, Salesforce — all connected."},{icon:<BarChart3 className="h-8 w-8"/>,title:"Analytics & AI Insights",desc:"AI analyzes your submissions for trends and patterns."},{icon:<Zap className="h-8 w-8"/>,title:"Developer-First API",desc:"Auto-generated docs, SDKs, CLI tool, code snippets."}].map(f=>(
            <div key={f.title} className="rounded-lg border p-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">{f.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-muted-foreground text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="container py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Simple Pricing</h2>
        <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
          {[{name:"Free",price:"₹0",features:["3 forms","100 submissions/mo","AI form builder","Basic spam protection","API access"],btn:"Get Started"},{name:"Pro",price:"₹499",period:"/mo",features:["Unlimited forms","Unlimited submissions","AI analytics","Turnstile + honeypot","Webhooks + integrations","Stripe payments","Priority support"],btn:"Start Pro Trial",highlight:true},{name:"Enterprise",price:"Custom",features:["Everything in Pro","RBAC + team access","SSO (SAML/OAuth)","SOC2/HIPAA/GDPR","White-labeling","Custom SLA"],btn:"Contact Sales",}].map(p=>(
            <div key={p.name} className={`rounded-lg border p-8 ${p.highlight?"border-primary shadow-lg":""}`}>
              {p.highlight&&<div className="text-xs font-medium text-primary mb-2">MOST POPULAR</div>}
              <h3 className="text-xl font-bold">{p.name}</h3>
              <div className="mt-4"><span className="text-4xl font-extrabold">{p.price}</span>{p.period&&<span className="text-muted-foreground">{p.period}</span>}</div>
              <ul className="mt-6 space-y-3">{p.features.map(f=><li key={f} className="flex items-center gap-2 text-sm"><span className="text-primary">✓</span> {f}</li>)}</ul>
              <Link href="/auth/signup" className="mt-6 block"><Button className="w-full" variant={p.highlight?"default":"outline"}>{p.btn}</Button></Link>
            </div>
          ))}
        </div>
      </section>
      <footer className="border-t py-8 mt-auto"><div className="container text-center text-sm text-muted-foreground">© 2024 FormFlow. Built with ❤️ for developers.</div></footer>
    </div>
  );
}
