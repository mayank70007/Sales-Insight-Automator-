"use client";

import React, { useCallback, useRef, useState } from "react";
import {
  UploadCloud,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  BarChart3,
  Mail,
  TrendingUp,
  MapPin,
  ShoppingBag,
  Package,
  XCircle,
  ArrowRight,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { analyzeSalesData, AnalyzeResponse } from "@/services/api";

const ACCEPTED = ".csv,.xlsx";
const MAX_SIZE = 5 * 1024 * 1024;

/* ---------- small sub-components ---------- */

function MetricCard({
  icon,
  label,
  value,
  accent = "blue",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: "blue" | "emerald" | "violet" | "amber" | "rose" | "sky";
}) {
  const ring: Record<string, string> = {
    blue: "from-blue-500/10 to-blue-500/5 ring-blue-200",
    emerald: "from-emerald-500/10 to-emerald-500/5 ring-emerald-200",
    violet: "from-violet-500/10 to-violet-500/5 ring-violet-200",
    amber: "from-amber-500/10 to-amber-500/5 ring-amber-200",
    rose: "from-rose-500/10 to-rose-500/5 ring-rose-200",
    sky: "from-sky-500/10 to-sky-500/5 ring-sky-200",
  };
  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${ring[accent]} ring-1 p-4 transition-transform hover:scale-[1.02]`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 text-lg font-bold text-foreground">{value}</p>
        </div>
        <div className="rounded-lg bg-white/70 p-2 shadow-sm">{icon}</div>
      </div>
    </div>
  );
}

function StepIndicator({ step, active }: { step: number; active: number }) {
  const labels = ["Upload", "Email", "Analyze"];
  return (
    <div className="flex items-center justify-center gap-1 mb-6">
      {labels.map((l, i) => (
        <React.Fragment key={l}>
          <div className="flex flex-col items-center gap-1">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                i < active
                  ? "bg-emerald-500 text-white"
                  : i === active
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {i < active ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
            </div>
            <span
              className={`text-[10px] font-medium ${
                i <= active ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {l}
            </span>
          </div>
          {i < labels.length - 1 && (
            <div
              className={`h-px w-10 mt-[-14px] ${
                i < active ? "bg-emerald-400" : "bg-border"
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

/* ---------- main component ---------- */

export default function SalesForm() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const activeStep = result?.success ? 3 : email ? 2 : file ? 1 : 0;

  const processFile = useCallback((selected: File) => {
    setError(null);
    setResult(null);
    if (selected.size > MAX_SIZE) {
      setError("File exceeds the 5 MB limit.");
      return;
    }
    const ext = selected.name.split(".").pop()?.toLowerCase();
    if (!ext || !["csv", "xlsx"].includes(ext)) {
      setError("Only .csv and .xlsx files are supported.");
      return;
    }
    setFile(selected);
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (selected) processFile(selected);
    },
    [processFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const selected = e.dataTransfer.files?.[0];
      if (selected) processFile(selected);
    },
    [processFile]
  );

  const handleReset = useCallback(() => {
    setFile(null);
    setEmail("");
    setResult(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!file) {
        setError("Please upload a file.");
        return;
      }
      if (!email) {
        setError("Please enter a recipient email.");
        return;
      }
      setError(null);
      setResult(null);
      setLoading(true);
      try {
        const data = await analyzeSalesData(file, email);
        if (data.success) {
          setResult(data);
        } else {
          setError(data.detail || "Analysis failed.");
        }
      } catch (err: unknown) {
        if (
          typeof err === "object" &&
          err !== null &&
          "response" in err &&
          typeof (err as Record<string, unknown>).response === "object"
        ) {
          const resp = (err as { response: { data?: { detail?: string } } })
            .response;
          setError(resp.data?.detail || "Server error. Please try again.");
        } else {
          setError("Network error. Please check your connection.");
        }
      } finally {
        setLoading(false);
      }
    },
    [file, email]
  );

  const fmt = (n: number) =>
    n >= 1_000_000
      ? `$${(n / 1_000_000).toFixed(2)}M`
      : n >= 1_000
      ? `$${(n / 1_000).toFixed(1)}K`
      : `$${n.toFixed(2)}`;

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
          <Sparkles className="h-3.5 w-3.5" />
          AI-Powered Analytics
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
          Sales Insight
          <span className="block text-primary">Automator</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
          Upload your sales data, get an AI executive summary, and receive it
          in your inbox — in seconds.
        </p>
      </div>

      <Card className="shadow-xl border-0 ring-1 ring-gray-200/60 bg-white/80 backdrop-blur">
        <CardContent className="pt-6 pb-8 px-6">
          {/* Step indicator */}
          <StepIndicator step={3} active={activeStep} />

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* ---------- File Upload ---------- */}
            <div className="space-y-2">
              <Label htmlFor="file" className="text-sm font-semibold">
                Sales Dataset
              </Label>
              <div
                onClick={() => fileRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                className={`group relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 cursor-pointer transition-all duration-200 ${
                  dragOver
                    ? "border-primary bg-primary/5 scale-[1.01]"
                    : file
                    ? "border-emerald-300 bg-emerald-50/50"
                    : "border-gray-200 hover:border-primary/40 hover:bg-gray-50/50"
                }`}
              >
                {file ? (
                  <>
                    <div className="rounded-xl bg-emerald-100 p-3">
                      <FileSpreadsheet className="h-7 w-7 text-emerald-600" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-emerald-700">
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {(file.size / 1024).toFixed(1)} KB — Click to change
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="rounded-xl bg-gray-100 p-3 group-hover:bg-primary/10 transition-colors">
                      <UploadCloud className="h-7 w-7 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">
                          Click to upload
                        </span>{" "}
                        or drag &amp; drop
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        CSV or XLSX — max 5 MB
                      </p>
                    </div>
                  </>
                )}
                <input
                  id="file"
                  ref={fileRef}
                  type="file"
                  accept={ACCEPTED}
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* ---------- Email ---------- */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold">
                Recipient Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="executive@company.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  className="pl-10 h-11 rounded-lg"
                  required
                />
              </div>
            </div>

            {/* ---------- Submit ---------- */}
            <Button
              type="submit"
              className="w-full h-12 rounded-lg text-sm font-semibold shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-shadow"
              size="lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing &amp; Generating Report…
                </>
              ) : (
                <>
                  Generate &amp; Send Report
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* ---------- Success ---------- */}
          {result?.success && (
            <div className="mt-8 space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Metrics */}
              {result.metrics && (
                <div className="grid grid-cols-2 gap-3">
                  <MetricCard
                    icon={<TrendingUp className="h-4 w-4 text-blue-500" />}
                    label="Total Revenue"
                    value={fmt(result.metrics.total_revenue)}
                    accent="blue"
                  />
                  <MetricCard
                    icon={<MapPin className="h-4 w-4 text-emerald-500" />}
                    label="Top Region"
                    value={result.metrics.top_region}
                    accent="emerald"
                  />
                  <MetricCard
                    icon={<ShoppingBag className="h-4 w-4 text-violet-500" />}
                    label="Top Category"
                    value={result.metrics.top_category}
                    accent="violet"
                  />
                  <MetricCard
                    icon={<Package className="h-4 w-4 text-amber-500" />}
                    label="Units Sold"
                    value={result.metrics.total_units_sold.toLocaleString()}
                    accent="amber"
                  />
                  <MetricCard
                    icon={<XCircle className="h-4 w-4 text-rose-500" />}
                    label="Cancelled"
                    value={`${result.metrics.cancelled_orders} (${result.metrics.cancellation_rate}%)`}
                    accent="rose"
                  />
                  <MetricCard
                    icon={<Mail className="h-4 w-4 text-sky-500" />}
                    label="Email Status"
                    value="Delivered"
                    accent="sky"
                  />
                </div>
              )}

              {/* Summary Card */}
              <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="rounded-full bg-emerald-100 p-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  </div>
                  <span className="text-sm font-bold text-emerald-800">
                    Report sent to {email}
                  </span>
                </div>
                <div className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto pr-2">
                  {result.summary}
                </div>
              </div>

              {/* Reset */}
              <Button
                variant="outline"
                className="w-full h-11 rounded-lg"
                onClick={handleReset}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Start New Analysis
              </Button>
            </div>
          )}

          {/* ---------- Error ---------- */}
          {error && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3 animate-in fade-in duration-300">
              <div className="rounded-full bg-red-100 p-1.5 mt-0.5">
                <AlertCircle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-red-800">
                  Something went wrong
                </p>
                <p className="text-sm text-red-700 mt-0.5">{error}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer */}
      <p className="text-center text-xs text-muted-foreground mt-6">
        Powered by <span className="font-semibold">Groq AI</span> &middot;
        Built with Next.js &amp; FastAPI
      </p>
    </div>
  );
}
