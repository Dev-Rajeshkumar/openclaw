export default function ApiDocsPage() {
  return (<div className="min-h-screen bg-muted/30"><header className="border-b bg-background"><div className="container flex h-16 items-center"><h1 className="text-xl font-bold">API Documentation</h1></div></header>
    <main className="container py-8 max-w-3xl">
      <h2 className="text-2xl font-bold mb-6">FormFlow API</h2>
      <div className="space-y-6">
        <div className="p-4 border rounded-lg"><div className="flex items-center gap-2"><span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-medium">POST</span><code className="text-sm">/api/v1/auth/signup</code></div><p className="text-sm text-muted-foreground mt-2">Create a new account</p></div>
        <div className="p-4 border rounded-lg"><div className="flex items-center gap-2"><span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-medium">POST</span><code className="text-sm">/api/v1/auth/login</code></div><p className="text-sm text-muted-foreground mt-2">Sign in to your account</p></div>
        <div className="p-4 border rounded-lg"><div className="flex items-center gap-2"><span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-medium">GET</span><code className="text-sm">/api/v1/forms</code></div><p className="text-sm text-muted-foreground mt-2">List all forms</p></div>
        <div className="p-4 border rounded-lg"><div className="flex items-center gap-2"><span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-medium">POST</span><code className="text-sm">/api/v1/submissions/:slug</code></div><p className="text-sm text-muted-foreground mt-2">Submit a form (public endpoint)</p></div>
        <div className="p-4 border rounded-lg"><div className="flex items-center gap-2"><span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-xs font-medium">POST</span><code className="text-sm">/api/v1/ai/generate-form</code></div><p className="text-sm text-muted-foreground mt-2">Generate form with AI</p></div>
      </div>
    </main></div>);
}
