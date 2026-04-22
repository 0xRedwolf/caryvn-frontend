'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';


const API_ENDPOINT = 'https://api.caryvn.com/api/v2/';

// Types
type Action = 'services' | 'balance' | 'add' | 'status' | 'refill';

// Code examples per action
const CODE_EXAMPLES: Record<Action, { curl: string; python: string; php: string }> = {
  services: {
    curl: `curl -X POST ${API_ENDPOINT} \\
  -d "key=YOUR_API_KEY" \\
  -d "action=services"`,
    python: `import requests

response = requests.post("${API_ENDPOINT}", data={
    "key": "YOUR_API_KEY",
    "action": "services"
})
print(response.json())`,
    php: `<?php
$response = file_get_contents("${API_ENDPOINT}", false, stream_context_create([
    "http" => [
        "method" => "POST",
        "header" => "Content-Type: application/x-www-form-urlencoded",
        "content" => http_build_query(["key" => "YOUR_API_KEY", "action" => "services"])
    ]
]));
echo $response;`,
  },
  balance: {
    curl: `curl -X POST ${API_ENDPOINT} \\
  -d "key=YOUR_API_KEY" \\
  -d "action=balance"`,
    python: `import requests

response = requests.post("${API_ENDPOINT}", data={
    "key": "YOUR_API_KEY",
    "action": "balance"
})
data = response.json()
print(f"Balance: {data['balance']} {data['currency']}")`,
    php: `<?php
$response = file_get_contents("${API_ENDPOINT}", false, stream_context_create([
    "http" => [
        "method" => "POST",
        "header" => "Content-Type: application/x-www-form-urlencoded",
        "content" => http_build_query(["key" => "YOUR_API_KEY", "action" => "balance"])
    ]
]));
echo $response;`,
  },
  add: {
    curl: `curl -X POST ${API_ENDPOINT} \\
  -d "key=YOUR_API_KEY" \\
  -d "action=add" \\
  -d "service=1" \\
  -d "link=https://www.instagram.com/username/" \\
  -d "quantity=1000"`,
    python: `import requests

response = requests.post("${API_ENDPOINT}", data={
    "key": "YOUR_API_KEY",
    "action": "add",
    "service": 1,
    "link": "https://www.instagram.com/username/",
    "quantity": 1000,
    # Optional:
    # "comments": "Great post!\\nAmazing content!",  # newline-separated
})
data = response.json()
print(f"Order ID: {data['order']}")`,
    php: `<?php
$response = file_get_contents("${API_ENDPOINT}", false, stream_context_create([
    "http" => [
        "method" => "POST",
        "header" => "Content-Type: application/x-www-form-urlencoded",
        "content" => http_build_query([
            "key"      => "YOUR_API_KEY",
            "action"   => "add",
            "service"  => 1,
            "link"     => "https://www.instagram.com/username/",
            "quantity" => 1000,
        ])
    ]
]));
$data = json_decode($response, true);
echo "Order ID: " . $data["order"];`,
  },
  status: {
    curl: `curl -X POST ${API_ENDPOINT} \\
  -d "key=YOUR_API_KEY" \\
  -d "action=status" \\
  -d "order=42"`,
    python: `import requests

response = requests.post("${API_ENDPOINT}", data={
    "key": "YOUR_API_KEY",
    "action": "status",
    "order": 42  # reseller_order_id returned from action=add
})
data = response.json()
print(f"Status: {data['status']} — {data['start_count']} → {data['remains']} remaining")`,
    php: `<?php
$response = file_get_contents("${API_ENDPOINT}", false, stream_context_create([
    "http" => [
        "method" => "POST",
        "header" => "Content-Type: application/x-www-form-urlencoded",
        "content" => http_build_query([
            "key"    => "YOUR_API_KEY",
            "action" => "status",
            "order"  => 42
        ])
    ]
]));
echo $response;`,
  },
  refill: {
    curl: `curl -X POST ${API_ENDPOINT} \\
  -d "key=YOUR_API_KEY" \\
  -d "action=refill" \\
  -d "order=42"`,
    python: `import requests

response = requests.post("${API_ENDPOINT}", data={
    "key": "YOUR_API_KEY",
    "action": "refill",
    "order": 42
})
data = response.json()
print(f"Refill ID: {data.get('refill')}")`,
    php: `<?php
$response = file_get_contents("${API_ENDPOINT}", false, stream_context_create([
    "http" => [
        "method" => "POST",
        "header" => "Content-Type: application/x-www-form-urlencoded",
        "content" => http_build_query([
            "key"    => "YOUR_API_KEY",
            "action" => "refill",
            "order"  => 42
        ])
    ]
]));
echo $response;`,
  },
};

//Response examples
const RESPONSE_EXAMPLES: Record<Action, string> = {
  services: `[
  {
    "service": 1,
    "name": "Instagram Followers [HQ]",
    "type": "Default",
    "rate": "1.50",
    "min": "100",
    "max": "100000",
    "refill": true,
    "cancel": false
  },
  ...
]`,
  balance: `{
  "balance": "48750.00",
  "currency": "NGN"
}`,
  add: `{
  "order": 42
}`,
  status: `{
  "charge": "150.00",
  "start_count": "1240",
  "status": "Processing",
  "remains": "850",
  "currency": "NGN"
}`,
  refill: `{
  "refill": 17
}`,
};

// Action metadata
const ACTIONS: { id: Action; label: string; desc: string; method: string; params: { name: string; required: boolean; desc: string }[] }[] = [
  {
    id: 'services',
    label: 'List Services',
    desc: 'Returns all active services available on the panel in standard SMM v2 format.',
    method: 'POST',
    params: [
      { name: 'key', required: true, desc: 'Your API key' },
      { name: 'action', required: true, desc: 'Must be services' },
    ],
  },
  {
    id: 'balance',
    label: 'Get Balance',
    desc: "Returns the authenticated account's current wallet balance and currency.",
    method: 'POST',
    params: [
      { name: 'key', required: true, desc: 'Your API key' },
      { name: 'action', required: true, desc: 'Must be balance' },
    ],
  },
  {
    id: 'add',
    label: 'Create Order',
    desc: 'Places a new order. Returns a numeric order ID for status tracking.',
    method: 'POST',
    params: [
      { name: 'key', required: true, desc: 'Your API key' },
      { name: 'action', required: true, desc: 'Must be add' },
      { name: 'service', required: true, desc: 'Service ID (from action=services)' },
      { name: 'link', required: true, desc: 'Full URL of the target post/profile' },
      { name: 'quantity', required: true, desc: 'Amount to order (within service min/max)' },
      { name: 'comments', required: false, desc: 'Newline-separated comments (comment services only, max 500 chars)' },
    ],
  },
  {
    id: 'status',
    label: 'Order Status',
    desc: 'Returns the current status, start count, and remaining count for an order.',
    method: 'POST',
    params: [
      { name: 'key', required: true, desc: 'Your API key' },
      { name: 'action', required: true, desc: 'Must be status' },
      { name: 'order', required: true, desc: 'Numeric order ID returned from action=add' },
    ],
  },
  {
    id: 'refill',
    label: 'Request Refill',
    desc: 'Requests a refill for a completed order where the count has dropped.',
    method: 'POST',
    params: [
      { name: 'key', required: true, desc: 'Your API key' },
      { name: 'action', required: true, desc: 'Must be refill' },
      { name: 'order', required: true, desc: 'Numeric order ID to refill' },
    ],
  },
];

// Reusable Code Block
function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <div className="flex items-center justify-between bg-surface-darker rounded-t-xl px-4 py-2.5 border border-border-dark border-b-0">
        <span className="text-xs font-mono text-text-secondary uppercase tracking-widest">{language}</span>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-white transition-colors"
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="bg-surface-darker border border-border-dark rounded-b-xl p-5 overflow-x-auto text-sm leading-relaxed">
        <code className="text-text-secondary font-mono whitespace-pre">{code}</code>
      </pre>
    </div>
  );
}

//Main Page
export default function ApiDocsPage() {
  const { user, isAuthenticated } = useAuth();
  const [activeAction, setActiveAction] = useState<Action>('add');
  const [activeLang, setActiveLang] = useState<'curl' | 'python' | 'php'>('curl');
  const [keyVisible, setKeyVisible] = useState(false);

  const apiKey = (user as { api_key?: string } | null)?.api_key;
  const action = ACTIONS.find(a => a.id === activeAction)!;

  return (
    <div className="min-h-screen bg-background-dark">
      <Navbar />

      {/*Hero*/}
      <section className="relative pt-28 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 mb-6">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-primary">API v2 — Live</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-[1.1] mb-6">
              Reseller API<br />
              <span className="text-primary">Documentation</span>
            </h1>
            <p className="text-lg md:text-xl text-text-secondary leading-relaxed max-w-2xl mb-8">
              Automate orders, check balances, and manage your reseller workflow with our standard SMM Panel v2-compatible REST API.
            </p>
            <div className="flex flex-wrap gap-4">
              {isAuthenticated ? (
                <Link href="/dashboard/settings" className="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-xl">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  Get My API Key
                </Link>
              ) : (
                <Link href="/register" className="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-xl">
                  Create Account
                </Link>
              )}
              <a href="#reference" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-border-dark text-white hover:border-primary/40 transition-colors">
                Jump to Reference
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 lg:px-8 pb-24 space-y-12">

        {/*Quick-start cards*/}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: 'M13 10V3L4 14h7v7l9-11h-7z', title: 'Single Endpoint', desc: `All actions POST to ${API_ENDPOINT}` },
            { icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z', title: 'API Key Auth', desc: 'Pass key= in form body. No Bearer tokens.' },
            { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', title: 'SMM Panel v2', desc: 'Compatible with standard v2 reseller scripts.' },
          ].map((c, i) => (
            <div key={i} className="bg-surface-dark border border-border-dark rounded-xl p-5 flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={c.icon} />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm mb-1">{c.title}</h3>
                <p className="text-text-secondary text-xs leading-relaxed">{c.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/*Endpoint box*/}
        <div className="bg-surface-dark border border-border-dark rounded-xl p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-text-secondary mb-3">Base Endpoint</p>
          <div className="flex items-center gap-3 bg-surface-darker rounded-lg px-4 py-3 border border-border-dark font-mono text-sm">
            <span className="text-emerald-400 font-bold">POST</span>
            <span className="text-white">{API_ENDPOINT}</span>
          </div>
          <p className="text-text-secondary text-xs mt-3">
            Content-Type: <code className="text-primary">application/x-www-form-urlencoded</code>
          </p>
        </div>

        {/*My API Key (authenticated only)*/}
        {isAuthenticated && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Your API Key</p>
              {apiKey && (
                <button
                  onClick={() => setKeyVisible(v => !v)}
                  className="text-xs text-text-secondary hover:text-white flex items-center gap-1 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    {keyVisible
                      ? <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      : <><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
                    }
                  </svg>
                  {keyVisible ? 'Hide' : 'Reveal'}
                </button>
              )}
            </div>
            {apiKey ? (
              <div className="flex items-center gap-3 bg-surface-darker rounded-lg px-4 py-3 border border-border-dark font-mono text-sm">
                <span className="text-white flex-1 truncate">
                  {keyVisible ? apiKey : '•'.repeat(Math.min(apiKey.length, 48))}
                </span>
                <button
                  onClick={() => { navigator.clipboard.writeText(apiKey); }}
                  className="text-text-secondary hover:text-primary transition-colors shrink-0"
                  title="Copy API key"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            ) : (
              <p className="text-text-secondary text-sm">
                No API key yet.{' '}
                <Link href="/dashboard/settings" className="text-primary hover:underline">
                  Generate one in Settings →
                </Link>
              </p>
            )}
          </div>
        )}

        {/*Interactive API Reference*/}
        <div id="reference" className="scroll-mt-8">
          <h2 className="text-2xl font-bold text-white mb-6">API Reference</h2>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar */}
            <div className="lg:w-56 shrink-0">
              <div className="bg-surface-dark border border-border-dark rounded-xl overflow-hidden sticky top-6">
                {ACTIONS.map(a => (
                  <button
                    key={a.id}
                    onClick={() => setActiveAction(a.id)}
                    className={`w-full text-left px-4 py-3 text-sm border-b border-border-dark last:border-b-0 flex items-center justify-between transition-colors ${
                      activeAction === a.id
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-text-secondary hover:text-white hover:bg-primary/5'
                    }`}
                  >
                    {a.label}
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase font-mono">
                      {a.method}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Detail panel */}
            <div className="flex-1 min-w-0 space-y-6">
              {/* Action header */}
              <div className="bg-surface-dark border border-border-dark rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-bold px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase font-mono">POST</span>
                  <code className="text-white font-mono text-sm">{API_ENDPOINT}</code>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{action.label}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{action.desc}</p>
              </div>

              {/* Parameters */}
              <div className="bg-surface-dark border border-border-dark rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-border-dark">
                  <h4 className="text-sm font-semibold text-white">Parameters</h4>
                </div>
                <div className="divide-y divide-border-dark">
                  {action.params.map(p => (
                    <div key={p.name} className="px-6 py-4 flex items-start gap-4">
                      <div className="w-32 shrink-0">
                        <code className="text-primary text-sm font-mono">{p.name}</code>
                        <div className="mt-0.5">
                          {p.required
                            ? <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">required</span>
                            : <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">optional</span>
                          }
                        </div>
                      </div>
                      <p className="text-text-secondary text-sm leading-relaxed">{p.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Code example */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  {(['curl', 'python', 'php'] as const).map(lang => (
                    <button
                      key={lang}
                      onClick={() => setActiveLang(lang)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        activeLang === lang
                          ? 'bg-primary text-white'
                          : 'bg-surface-dark border border-border-dark text-text-secondary hover:text-white'
                      }`}
                    >
                      {lang === 'curl' ? 'cURL' : lang.charAt(0).toUpperCase() + lang.slice(1)}
                    </button>
                  ))}
                </div>
                <CodeBlock code={CODE_EXAMPLES[activeAction][activeLang]} language={activeLang === 'curl' ? 'bash' : activeLang} />
              </div>

              {/* Response */}
              <div>
                <h4 className="text-sm font-semibold text-white mb-3">Response</h4>
                <CodeBlock code={RESPONSE_EXAMPLES[activeAction]} language="json" />
              </div>
            </div>
          </div>
        </div>

        {/*Error codes*/}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Errors</h2>
          <div className="bg-surface-dark border border-border-dark rounded-xl overflow-hidden">
            <div className="grid grid-cols-3 px-6 py-3 border-b border-border-dark text-xs font-bold uppercase tracking-widest text-text-secondary">
              <span>HTTP Status</span><span>Error field</span><span>Meaning</span>
            </div>
            {[
              { code: '401', error: 'Invalid API key.', meaning: 'Key not found or inactive' },
              { code: '400', error: 'Action is required.', meaning: 'Missing action parameter' },
              { code: '400', error: 'Invalid action.', meaning: 'Unsupported action value' },
              { code: '400', error: 'Invalid URL format.', meaning: 'link= is not a valid URL' },
              { code: '400', error: 'Service not found.', meaning: 'service= ID does not exist or is inactive' },
              { code: '400', error: 'Quantity out of range.', meaning: 'quantity < min or > max for the service' },
              { code: '400', error: 'Insufficient balance.', meaning: 'Wallet balance too low for the order' },
              { code: '400', error: 'Order not found.', meaning: 'order= ID belongs to a different account' },
              { code: '429', error: 'Request was throttled.', meaning: 'Rate limit exceeded (200 req/min)' },
            ].map((row, i) => (
              <div key={i} className="grid grid-cols-3 px-6 py-3 border-b border-border-dark last:border-b-0 text-sm">
                <span className="font-mono text-amber-400">{row.code}</span>
                <span className="font-mono text-red-400 text-xs">{row.error}</span>
                <span className="text-text-secondary">{row.meaning}</span>
              </div>
            ))}
          </div>
        </div>

        {/*Rate limits*/}
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-amber-400 font-semibold mb-1">Rate Limits</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                The API endpoint is limited to <strong className="text-white">200 requests per minute</strong> per API key.
                Exceeding this returns <code className="text-amber-400">HTTP 429</code>. Implement exponential backoff in your scripts for resilience.
              </p>
            </div>
          </div>
        </div>

        {/*CTA*/}
        {!isAuthenticated && (
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-3">Ready to start automating?</h2>
            <p className="text-text-secondary mb-6">Create a free account to get your API key and start placing orders programmatically.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/register" className="btn-primary px-8 py-3 rounded-xl">Create Free Account</Link>
              <Link href="/services" className="px-8 py-3 rounded-xl border border-border-dark text-white hover:border-primary/40 transition-colors">Browse Services</Link>
            </div>
          </div>
        )}

      </div>

      <Footer />
    </div>
  );
}
