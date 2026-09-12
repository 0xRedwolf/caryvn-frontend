'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/lib/utils';
import DashboardShell from '@/components/dashboard/DashboardShell';

const API_ENDPOINT = 'https://www.caryvn.com/api/v2/';

// Supported actions
type Action = 'services' | 'add' | 'status' | 'status_batch' | 'balance' | 'refill' | 'refill_status';
type CodeLang = 'curl' | 'python' | 'javascript' | 'php';

interface ParamDef {
  name: string;
  type: string;
  required: boolean;
  desc: string;
  notes?: string;
}

interface ActionDoc {
  id: Action;
  label: string;
  shortDesc: string;
  fullDesc: string;
  method: 'POST';
  params: ParamDef[];
  response: string;
  curl: string;
  python: string;
  javascript: string;
  php: string;
}

const ACTION_DOCS: ActionDoc[] = [
  {
    id: 'services',
    label: 'List Services',
    shortDesc: 'Retrieve all 800+ active services with live rates',
    fullDesc: 'Returns all active SMM services available on Caryvn in standard SMM Panel v2 format. Rates are formatted per 1,000 units in Nigerian Naira (NGN).',
    method: 'POST',
    params: [
      { name: 'key', type: 'string', required: true, desc: 'Your account API key.' },
      { name: 'action', type: 'string', required: true, desc: 'Must be "services".' },
    ],
    response: `[
  {
    "service": 1,
    "name": "Instagram Followers [High Quality - Non Drop]",
    "type": "Default",
    "category": "Instagram Followers",
    "rate": "1500.00",
    "min": "50",
    "max": "50000",
    "refill": true,
    "cancel": false,
    "description": "High retention authentic followers. Starts within 5-15 mins.",
    "average_time": "12 minutes"
  },
  {
    "service": 42,
    "name": "TikTok Likes [Instant - Real Accounts]",
    "type": "Default",
    "category": "TikTok Likes",
    "rate": "850.00",
    "min": "100",
    "max": "100000",
    "refill": false,
    "cancel": false,
    "description": "Instant delivery. Safe for all video types.",
    "average_time": "4 minutes"
  }
]`,
    curl: `curl -X POST "${API_ENDPOINT}" \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "key=YOUR_API_KEY" \\
  -d "action=services"`,
    python: `import requests

url = "${API_ENDPOINT}"
payload = {
    "key": "YOUR_API_KEY",
    "action": "services"
}

response = requests.post(url, data=payload)
services = response.json()
print(f"Loaded {len(services)} services.")
for s in services[:3]:
    print(f"[{s['service']}] {s['name']} - ₦{s['rate']} / 1k")`,
    javascript: `const url = "${API_ENDPOINT}";
const body = new URLSearchParams({
  key: "YOUR_API_KEY",
  action: "services"
});

const response = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body
});

const services = await response.json();
console.log("Services:", services);`,
    php: `<?php
$url = "${API_ENDPOINT}";
$data = [
    "key"    => "YOUR_API_KEY",
    "action" => "services"
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
curl_close($ch);

$services = json_decode($response, true);
print_r($services);
?>`,
  },
  {
    id: 'add',
    label: 'Create Order',
    shortDesc: 'Place a new social media growth order',
    fullDesc: 'Places a new order for social media engagement. Automatically verifies URL syntax, checks minimum and maximum quantity constraints, and deducts the cost from your NGN wallet balance.',
    method: 'POST',
    params: [
      { name: 'key', type: 'string', required: true, desc: 'Your account API key.' },
      { name: 'action', type: 'string', required: true, desc: 'Must be "add".' },
      { name: 'service', type: 'integer', required: true, desc: 'Numeric Service ID (from action=services).' },
      { name: 'link', type: 'string (url)', required: true, desc: 'Target profile or post URL (must be valid http:// or https://).' },
      { name: 'quantity', type: 'integer', required: true, desc: 'Number of units to deliver (within service min and max bounds).' },
      { name: 'comments', type: 'string', required: false, desc: 'Newline-separated custom comments (for comment services only, max 500 chars).' },
    ],
    response: `{
  "order": 14205
}`,
    curl: `curl -X POST "${API_ENDPOINT}" \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "key=YOUR_API_KEY" \\
  -d "action=add" \\
  -d "service=1" \\
  -d "link=https://www.instagram.com/caryvn" \\
  -d "quantity=1000"`,
    python: `import requests

url = "${API_ENDPOINT}"
payload = {
    "key": "YOUR_API_KEY",
    "action": "add",
    "service": 1,
    "link": "https://www.instagram.com/caryvn",
    "quantity": 1000
    # Optional for comment services:
    # "comments": "Great work!\\nLove this post!\\nKeep growing!"
}

response = requests.post(url, data=payload)
data = response.json()
print("Created Order ID:", data.get("order"))`,
    javascript: `const url = "${API_ENDPOINT}";
const body = new URLSearchParams({
  key: "YOUR_API_KEY",
  action: "add",
  service: "1",
  link: "https://www.instagram.com/caryvn",
  quantity: "1000"
});

const response = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body
});

const result = await response.json();
console.log("Created Order ID:", result.order);`,
    php: `<?php
$url = "${API_ENDPOINT}";
$data = [
    "key"      => "YOUR_API_KEY",
    "action"   => "add",
    "service"  => 1,
    "link"     => "https://www.instagram.com/caryvn",
    "quantity" => 1000
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
echo "Order ID: " . $result["order"];
?>`,
  },
  {
    id: 'status',
    label: 'Single Order Status',
    shortDesc: 'Track live fulfillment progress of one order',
    fullDesc: 'Fetches the current real-time delivery status, start count, remaining count, and charged amount for a specific order by numeric Order ID or UUID.',
    method: 'POST',
    params: [
      { name: 'key', type: 'string', required: true, desc: 'Your account API key.' },
      { name: 'action', type: 'string', required: true, desc: 'Must be "status".' },
      { name: 'order', type: 'integer / uuid', required: true, desc: 'The order ID returned when the order was created.' },
    ],
    response: `{
  "charge": "1500.00",
  "start_count": "1240",
  "status": "In progress",
  "remains": "450",
  "currency": "NGN"
}`,
    curl: `curl -X POST "${API_ENDPOINT}" \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "key=YOUR_API_KEY" \\
  -d "action=status" \\
  -d "order=14205"`,
    python: `import requests

url = "${API_ENDPOINT}"
payload = {
    "key": "YOUR_API_KEY",
    "action": "status",
    "order": 14205
}

response = requests.post(url, data=payload)
data = response.json()
print(f"Status: {data['status']} | Start: {data['start_count']} | Remains: {data['remains']}")`,
    javascript: `const url = "${API_ENDPOINT}";
const body = new URLSearchParams({
  key: "YOUR_API_KEY",
  action: "status",
  order: "14205"
});

const response = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body
});

const status = await response.json();
console.log("Order Status:", status);`,
    php: `<?php
$url = "${API_ENDPOINT}";
$data = [
    "key"    => "YOUR_API_KEY",
    "action" => "status",
    "order"  => 14205
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
curl_close($ch);

$status = json_decode($response, true);
print_r($status);
?>`,
  },
  {
    id: 'status_batch',
    label: 'Batch Orders Status',
    shortDesc: 'Query progress for multiple orders in one request',
    fullDesc: 'Check up to 100 orders in a single API call by passing comma-separated order IDs. Returns an associative object keyed by each order ID.',
    method: 'POST',
    params: [
      { name: 'key', type: 'string', required: true, desc: 'Your account API key.' },
      { name: 'action', type: 'string', required: true, desc: 'Must be "status".' },
      { name: 'orders', type: 'string', required: true, desc: 'Comma-separated order IDs, e.g. "14205,14206,14207".' },
    ],
    response: `{
  "14205": {
    "charge": "1500.00",
    "start_count": "1240",
    "status": "Completed",
    "remains": "0",
    "currency": "NGN"
  },
  "14206": {
    "charge": "850.00",
    "start_count": "512",
    "status": "In progress",
    "remains": "200",
    "currency": "NGN"
  },
  "14207": {
    "error": "Incorrect order ID"
  }
}`,
    curl: `curl -X POST "${API_ENDPOINT}" \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "key=YOUR_API_KEY" \\
  -d "action=status" \\
  -d "orders=14205,14206,14207"`,
    python: `import requests

url = "${API_ENDPOINT}"
payload = {
    "key": "YOUR_API_KEY",
    "action": "status",
    "orders": "14205,14206,14207"
}

response = requests.post(url, data=payload)
batch_results = response.json()
for order_id, info in batch_results.items():
    print(f"Order #{order_id}: {info.get('status', info.get('error'))}")`,
    javascript: `const url = "${API_ENDPOINT}";
const body = new URLSearchParams({
  key: "YOUR_API_KEY",
  action: "status",
  orders: "14205,14206,14207"
});

const response = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body
});

const batchResults = await response.json();
console.log("Batch Results:", batchResults);`,
    php: `<?php
$url = "${API_ENDPOINT}";
$data = [
    "key"    => "YOUR_API_KEY",
    "action" => "status",
    "orders" => "14205,14206,14207"
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
curl_close($ch);

$batchResults = json_decode($response, true);
print_r($batchResults);
?>`,
  },
  {
    id: 'balance',
    label: 'Check Balance',
    shortDesc: 'Query current wallet balance in Nigerian Naira',
    fullDesc: 'Returns the authenticated account current real-time available wallet balance and currency code (NGN).',
    method: 'POST',
    params: [
      { name: 'key', type: 'string', required: true, desc: 'Your account API key.' },
      { name: 'action', type: 'string', required: true, desc: 'Must be "balance".' },
    ],
    response: `{
  "balance": "48750.00",
  "currency": "NGN"
}`,
    curl: `curl -X POST "${API_ENDPOINT}" \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "key=YOUR_API_KEY" \\
  -d "action=balance"`,
    python: `import requests

url = "${API_ENDPOINT}"
payload = {
    "key": "YOUR_API_KEY",
    "action": "balance"
}

response = requests.post(url, data=payload)
data = response.json()
print(f"Current Balance: ₦{data['balance']} {data['currency']}")`,
    javascript: `const url = "${API_ENDPOINT}";
const body = new URLSearchParams({
  key: "YOUR_API_KEY",
  action: "balance"
});

const response = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body
});

const data = await response.json();
console.log(\`Balance: ₦\${data.balance} \${data.currency}\`);`,
    php: `<?php
$url = "${API_ENDPOINT}";
$data = [
    "key"    => "YOUR_API_KEY",
    "action" => "balance"
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);
echo "Balance: ₦" . $data["balance"] . " " . $data["currency"];
?>`,
  },
  {
    id: 'refill',
    label: 'Request Refill',
    shortDesc: 'Trigger automatic refill for dropped orders',
    fullDesc: 'Requests an automated refill for a completed order if followers or likes drop. The service must have refill enabled (refill: true), and the order must be in Completed status.',
    method: 'POST',
    params: [
      { name: 'key', type: 'string', required: true, desc: 'Your account API key.' },
      { name: 'action', type: 'string', required: true, desc: 'Must be "refill".' },
      { name: 'order', type: 'integer / uuid', required: true, desc: 'The completed order ID to refill.' },
    ],
    response: `{
  "refill": 894
}`,
    curl: `curl -X POST "${API_ENDPOINT}" \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "key=YOUR_API_KEY" \\
  -d "action=refill" \\
  -d "order=14205"`,
    python: `import requests

url = "${API_ENDPOINT}"
payload = {
    "key": "YOUR_API_KEY",
    "action": "refill",
    "order": 14205
}

response = requests.post(url, data=payload)
data = response.json()
print("Refill ID:", data.get("refill"))`,
    javascript: `const url = "${API_ENDPOINT}";
const body = new URLSearchParams({
  key: "YOUR_API_KEY",
  action: "refill",
  order: "14205"
});

const response = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body
});

const result = await response.json();
console.log("Refill ID:", result.refill);`,
    php: `<?php
$url = "${API_ENDPOINT}";
$data = [
    "key"    => "YOUR_API_KEY",
    "action" => "refill",
    "order"  => 14205
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
echo "Refill ID: " . $result["refill"];
?>`,
  },
  {
    id: 'refill_status',
    label: 'Refill Status',
    shortDesc: 'Track status of a refill request',
    fullDesc: 'Check the current progress of a refill by passing a single refill ID (refill=) or multiple comma-separated IDs (refills=).',
    method: 'POST',
    params: [
      { name: 'key', type: 'string', required: true, desc: 'Your account API key.' },
      { name: 'action', type: 'string', required: true, desc: 'Must be "refill_status".' },
      { name: 'refill', type: 'integer', required: false, desc: 'Single refill ID.' },
      { name: 'refills', type: 'string', required: false, desc: 'Comma-separated refill IDs e.g. "894,895".' },
    ],
    response: `{
  "status": "Completed"
}`,
    curl: `curl -X POST "${API_ENDPOINT}" \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "key=YOUR_API_KEY" \\
  -d "action=refill_status" \\
  -d "refill=894"`,
    python: `import requests

url = "${API_ENDPOINT}"
payload = {
    "key": "YOUR_API_KEY",
    "action": "refill_status",
    "refill": 894
}

response = requests.post(url, data=payload)
data = response.json()
print("Refill Status:", data.get("status"))`,
    javascript: `const url = "${API_ENDPOINT}";
const body = new URLSearchParams({
  key: "YOUR_API_KEY",
  action: "refill_status",
  refill: "894"
});

const response = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body
});

const result = await response.json();
console.log("Refill Status:", result.status);`,
    php: `<?php
$url = "${API_ENDPOINT}";
$data = [
    "key"    => "YOUR_API_KEY",
    "action" => "refill_status",
    "refill" => 894
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
echo "Refill Status: " . $result["status"];
?>`,
  },
];

const ERROR_LIST = [
  { code: '401', error: 'Invalid API key.', meaning: 'API key is missing, incorrect, or disabled.' },
  { code: '400', error: 'Missing required parameter: service', meaning: 'The service parameter was omitted from action=add.' },
  { code: '400', error: 'Parameter "link" must be a valid http:// or https:// URL', meaning: 'The destination link is malformed or missing scheme.' },
  { code: '400', error: 'Minimum quantity for this service is X', meaning: 'Quantity requested is below the required threshold.' },
  { code: '400', error: 'Maximum quantity for this service is X', meaning: 'Quantity requested exceeds the upper limit for this service.' },
  { code: '400', error: 'Insufficient balance.', meaning: 'Your NGN wallet balance is lower than the order cost.' },
  { code: '400', error: 'You already have an active order for this link + service combination.', meaning: 'Duplicate order lock. Wait for current order to complete.' },
  { code: '400', error: 'This service does not support refills', meaning: 'Refill requested for an order whose service has refill=false.' },
  { code: '400', error: 'Order must be completed before requesting a refill', meaning: 'Refill requested before the order reached Completed status.' },
  { code: '429', error: 'Too many requests. Please wait a moment...', meaning: 'Rate limit exceeded (max 200 requests/minute per key).' },
];

function CodeDisplay({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-50/80 shadow-xs">
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 bg-slate-100 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
          <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
          <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
          <span className="text-[11px] font-mono uppercase text-slate-600 font-bold ml-1">{language}</span>
        </div>
        <button
          onClick={handleCopy}
          type="button"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-colors cursor-pointer shadow-2xs"
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-emerald-700 text-xs font-bold">Copied</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="w-full max-w-full overflow-x-auto">
        <pre className="p-3 sm:p-4 text-xs sm:text-sm font-mono leading-relaxed text-slate-800 whitespace-pre">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}

export default function ApiDocsPage() {
  const { user, isAuthenticated } = useAuth();
  const [activeAction, setActiveAction] = useState<Action>('services');
  const [activeLang, setActiveLang] = useState<CodeLang>('curl');
  const [keyVisible, setKeyVisible] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const apiKey = (user as { api_key?: string } | null)?.api_key;
  const currentActionDoc = ACTION_DOCS.find((a) => a.id === activeAction) || ACTION_DOCS[0];

  const handleCopyKey = () => {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const apiContent = (
    <div className="w-full max-w-full overflow-x-hidden min-w-0">
      {/* Hero Header Section */}
      <section className={`w-full max-w-full rounded-2xl sm:rounded-3xl bg-white border border-slate-200 p-4 sm:p-8 shadow-xs mb-6 sm:mb-8 ${
        isAuthenticated ? 'mt-2' : 'mt-20 sm:mt-24'
      }`}>
        <div className="max-w-3xl min-w-0">
          {/* Status pill */}
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[11px] sm:text-xs font-bold text-emerald-700 mb-4 max-w-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="truncate">SMM Panel v2 Specification • Live & Operational</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-3 wrap-break-word">
            Developer & Reseller <span className="text-primary">API Documentation</span>
          </h1>

          <p className="text-xs sm:text-base text-slate-600 leading-relaxed mb-6">
            Seamlessly automate social media growth orders, retrieve real-time service rates in Nigerian Naira (₦), track live delivery progress, and trigger automatic refills.
          </p>

          {/* Base Endpoint Box */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 max-w-full min-w-0">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-xs sm:text-sm text-slate-800 max-w-full overflow-x-auto min-w-0">
              <span className="text-emerald-600 font-black shrink-0">POST</span>
              <span className="font-semibold break-all">{API_ENDPOINT}</span>
            </div>
            <span className="text-xs text-slate-500 wrap-break-word">
              Format: <code className="text-primary font-mono font-semibold break-all">application/x-www-form-urlencoded</code>
            </span>
          </div>
        </div>

        {/* User API Key Card */}
        <div className="mt-6 pt-6 border-t border-slate-100 max-w-3xl min-w-0">
          {isAuthenticated ? (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 max-w-full min-w-0">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Your Authenticated API Key
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-700 font-bold">
                    ACTIVE
                  </span>
                </div>
                {apiKey ? (
                  <div className="flex items-center gap-2 font-mono text-xs sm:text-sm text-slate-800 truncate">
                    <span className="truncate">{keyVisible ? apiKey : '••••••••••••••••••••••••••••••••••••••••'}</span>
                    <button
                      onClick={() => setKeyVisible(!keyVisible)}
                      type="button"
                      className="text-xs text-primary font-bold hover:underline shrink-0 ml-1 cursor-pointer"
                    >
                      {keyVisible ? 'Hide' : 'Reveal'}
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    No API key generated yet.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {apiKey ? (
                  <button
                    onClick={handleCopyKey}
                    type="button"
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary/90 transition-all shadow-xs cursor-pointer"
                  >
                    {copiedKey ? 'Copied' : 'Copy API Key'}
                  </button>
                ) : (
                  <Link
                    href="/dashboard/settings"
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary/90 transition-all shadow-xs"
                  >
                    Generate Key
                  </Link>
                )}
                <Link
                  href="/dashboard/settings"
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-white transition-all"
                >
                  Settings
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 max-w-full min-w-0">
              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 mb-0.5">Want to automate with Caryvn?</h4>
                <p className="text-xs text-slate-600">Create an account or log in to get your dedicated API key instantly.</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href="/register"
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary/90 transition-all shadow-xs"
                >
                  Create Account
                </Link>
                <Link
                  href="/login"
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 border border-slate-200 bg-white hover:bg-slate-50 transition-all"
                >
                  Log in
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Main Content Area */}
      <section className="w-full max-w-full pb-16 min-w-0">
        {/* Mobile Horizontal Tab Navigation (Strictly contained, no page overflow) */}
        <div className="lg:hidden mb-6 w-full max-w-full overflow-x-auto pb-2 scrollbar-none">
          <div className="flex items-center gap-1.5 w-max">
            {ACTION_DOCS.map((doc) => {
              const isSelected = activeAction === doc.id;
              return (
                <button
                  key={doc.id}
                  onClick={() => setActiveAction(doc.id)}
                  type="button"
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{doc.label}</span>
                  <span className={`text-[9px] px-1 py-0.2 rounded uppercase font-mono ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    POST
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-6 sm:gap-8 items-start w-full max-w-full min-w-0">
          {/* Desktop Sidebar Navigation (4 cols) */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-20 space-y-4 min-w-0">
            {/* Endpoint Actions list */}
            <div className="rounded-2xl bg-white border border-slate-200 p-2.5 space-y-1 shadow-xs">
              <div className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                API v2 Endpoints
              </div>
              {ACTION_DOCS.map((doc) => {
                const isSelected = activeAction === doc.id;
                return (
                  <button
                    key={doc.id}
                    onClick={() => setActiveAction(doc.id)}
                    type="button"
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-primary text-white shadow-xs font-bold'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium'
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="text-xs truncate">{doc.label}</p>
                      <p className={`text-[10px] truncate ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                        action={doc.id.replace('_batch', '')}
                      </p>
                    </div>
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      POST
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick Navigation Anchors */}
            <div className="rounded-2xl bg-white border border-slate-200 p-4 space-y-2 shadow-xs text-xs">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                Architecture & Guidance
              </div>
              <a href="#authentication" className="block text-slate-600 hover:text-primary transition-colors font-medium">
                Authentication & Key Usage
              </a>
              <a href="#currency" className="block text-slate-600 hover:text-primary transition-colors font-medium">
                Currency & Pricing (NGN)
              </a>
              <a href="#virtual-numbers" className="block text-slate-600 hover:text-primary transition-colors font-medium">
                Virtual Numbers & OTP Notice
              </a>
              <a href="#errors" className="block text-slate-600 hover:text-primary transition-colors font-medium">
                Error Codes & Troubleshooting
              </a>
              <a href="#limits" className="block text-slate-600 hover:text-primary transition-colors font-medium">
                Rate Limits & Concurrency Lock
              </a>
            </div>
          </aside>

          {/* Main Detail Panel (8 cols, min-w-0 and overflow-hidden prevent blowout on mobile) */}
          <main className="lg:col-span-8 space-y-6 sm:space-y-8 min-w-0 max-w-full overflow-hidden">
            {/* Active Action Detail Card */}
            <div className="rounded-2xl sm:rounded-3xl bg-white border border-slate-200 p-4 sm:p-8 space-y-6 shadow-xs w-full max-w-full min-w-0 overflow-hidden">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                      {currentActionDoc.method}
                    </span>
                    <code className="text-xs font-mono text-slate-500 font-bold">
                      action={currentActionDoc.id.replace('_batch', '')}
                    </code>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                    {currentActionDoc.label}
                  </h2>
                </div>

                {/* Language Selector */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                  {(['curl', 'python', 'javascript', 'php'] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setActiveLang(lang)}
                      type="button"
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeLang === lang
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {lang === 'curl' ? 'cURL' : lang === 'python' ? 'Python' : lang === 'javascript' ? 'Node' : 'PHP'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {currentActionDoc.fullDesc}
              </p>

              {/* Parameters Table */}
              <div className="space-y-2.5 w-full max-w-full">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Request Parameters
                </h3>
                <div className="w-full max-w-full overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                      <tr>
                        <th className="px-3 sm:px-4 py-2.5">Parameter</th>
                        <th className="px-3 sm:px-4 py-2.5">Type</th>
                        <th className="px-3 sm:px-4 py-2.5">Status</th>
                        <th className="px-3 sm:px-4 py-2.5">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentActionDoc.params.map((p) => (
                        <tr key={p.name} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-3 sm:px-4 py-2.5 font-mono font-bold text-primary whitespace-nowrap">
                            {p.name}
                          </td>
                          <td className="px-3 sm:px-4 py-2.5 font-mono text-slate-500 whitespace-nowrap text-[11px]">
                            {p.type}
                          </td>
                          <td className="px-3 sm:px-4 py-2.5 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                              p.required
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {p.required ? 'Required' : 'Optional'}
                            </span>
                          </td>
                          <td className="px-3 sm:px-4 py-2.5 text-slate-600 leading-relaxed text-xs min-w-40">
                            {p.desc}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Code Sample */}
              <div className="space-y-2.5 w-full max-w-full min-w-0">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Example Request ({activeLang.toUpperCase()})
                </h3>
                <CodeDisplay
                  code={currentActionDoc[activeLang]}
                  language={activeLang}
                />
              </div>

              {/* Example Response */}
              <div className="space-y-2.5 w-full max-w-full min-w-0">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Example Response (JSON)
                </h3>
                <CodeDisplay
                  code={currentActionDoc.response}
                  language="json"
                />
              </div>
            </div>

            {/* General Architecture Sections (Clean Light Theme) */}
            <div id="authentication" className="rounded-3xl bg-white border border-slate-200 p-5 sm:p-8 space-y-3 shadow-xs">
              <h3 className="text-lg font-bold text-slate-900">
                Authentication & Security
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Caryvn’s Reseller API requires authentication via your account’s unique API key. Every request to <code className="text-primary font-mono font-semibold">/api/v2/</code> must include <code className="text-primary font-mono font-semibold">key=YOUR_API_KEY</code> in the URL-encoded POST payload.
              </p>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                <p className="font-bold text-slate-800">Security Guidelines:</p>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li>Never expose your API key in client-side code (mobile apps or browser scripts).</li>
                  <li>Always route calls through your own secure backend server.</li>
                  <li>If your key is compromised, regenerate a new one anytime in Account Settings.</li>
                </ul>
              </div>
            </div>

            {/* Currency & Pricing Info */}
            <div id="currency" className="rounded-3xl bg-white border border-slate-200 p-5 sm:p-8 space-y-3 shadow-xs">
              <h3 className="text-lg font-bold text-slate-900">
                Currency & Pricing Policy
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                All services on Caryvn operate natively in <strong className="text-slate-900">Nigerian Naira (NGN - ₦)</strong>.
              </p>
              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <p className="font-bold text-primary mb-1">Rate Format</p>
                  <p className="text-slate-600 leading-relaxed">
                    Rates returned in <code className="text-primary font-mono">action=services</code> indicate the price per <strong>1,000 units</strong> in NGN.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <p className="font-bold text-emerald-700 mb-1">Automatic Partial Refunds</p>
                  <p className="text-slate-600 leading-relaxed">
                    If an order is canceled or partially completed, unfulfilled units are refunded back to your wallet balance automatically.
                  </p>
                </div>
              </div>
            </div>

            {/* Virtual Numbers Notice */}
            <div id="virtual-numbers" className="rounded-3xl bg-white border border-slate-200 p-5 sm:p-8 space-y-3 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-lg font-bold text-slate-900">
                  Virtual Numbers & SMS Verification
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Looking to acquire virtual phone numbers for SMS OTP verification? Caryvn provides instant temporary virtual numbers for WhatsApp, Telegram, Google, OpenAI, TikTok, and 500+ services.
              </p>
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-900">Interactive OTP Dashboard Active</p>
                  <p className="text-[11px] text-emerald-800">Rent numbers with real-time SMS stream and 100% auto-refund guarantee.</p>
                </div>
                <Link
                  href="/dashboard/virtual-numbers"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors whitespace-nowrap text-center shadow-xs"
                >
                  Open OTP Hub
                </Link>
              </div>
            </div>

            {/* Errors Reference Table */}
            <div id="errors" className="rounded-3xl bg-white border border-slate-200 p-5 sm:p-8 space-y-3 shadow-xs w-full max-w-full">
              <h3 className="text-lg font-bold text-slate-900">
                Error Codes Reference
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                When a request fails, the API responds with a non-200 HTTP status code and a JSON payload containing an <code className="text-rose-600 font-mono">error</code> message.
              </p>

              <div className="w-full max-w-full overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-3 sm:px-4 py-2.5">HTTP Code</th>
                      <th className="px-3 sm:px-4 py-2.5">Error Message</th>
                      <th className="px-3 sm:px-4 py-2.5">Resolution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ERROR_LIST.map((err, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-3 sm:px-4 py-2.5 font-mono font-bold text-amber-600 whitespace-nowrap">
                          {err.code}
                        </td>
                        <td className="px-3 sm:px-4 py-2.5 font-mono text-rose-600 whitespace-nowrap text-[11px]">
                          {err.error}
                        </td>
                        <td className="px-3 sm:px-4 py-2.5 text-slate-600 min-w-44">
                          {err.meaning}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Rate Limits & Concurrency */}
            <div id="limits" className="rounded-3xl bg-white border border-slate-200 p-5 sm:p-8 space-y-3 shadow-xs">
              <h3 className="text-lg font-bold text-slate-900">
                Rate Limits & Concurrency Locks
              </h3>
              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <p className="font-bold text-amber-700 mb-1">200 Requests / Minute</p>
                  <p className="text-slate-600 leading-relaxed">
                    API calls are throttled to 200 requests per minute per API key. If exceeded, HTTP 429 is returned. Implement exponential backoff for resilience.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <p className="font-bold text-blue-700 mb-1">Concurrency Lock</p>
                  <p className="text-slate-600 leading-relaxed">
                    Orders for the exact same service and destination link cannot be placed while an earlier order is still active, protecting against duplicate charges.
                  </p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </section>
    </div>
  );

  if (isAuthenticated) {
    return (
      <DashboardShell showBanner={false}>
        {apiContent}
      </DashboardShell>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col w-full max-w-full overflow-x-hidden">
      <Navbar />
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 min-w-0">
        {apiContent}
      </div>
      <Footer />
    </div>
  );
}
