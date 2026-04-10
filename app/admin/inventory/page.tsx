"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, FileText, AlertTriangle, Trash2,
  Package, ChevronDown, Info, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

// ── Types ─────────────────────────────────────────────────────────────────────
type Category = "Facebook" | "Instagram" | "TikTok" | "Twitter/X" | "Gmail" | "LinkedIn" | "Snapchat" | "Other";

interface ParsedLog {
  username: string;
  password: string;
  email: string | null;
  emailPass: string | null;
  twoFA: string | null;
}

interface Session {
  id: string;
  name: string;
  category: string;
  uploadedAt: string;
  count: number;
}

const CATEGORIES: Category[] = ["Facebook", "Instagram", "TikTok", "Twitter/X", "Gmail", "LinkedIn", "Snapchat", "Other"];
const CATEGORY_ICONS: Record<Category, string> = {
  Facebook: "📘", Instagram: "📸", TikTok: "🎵", "Twitter/X": "🐦",
  Gmail: "📧", LinkedIn: "💼", Snapchat: "👻", Other: "🔗",
};

const MINT      = "oklch(0.80 0.19 162)";
const MINT_DARK = "oklch(0.68 0.17 162)";
const MINT_BTN  = { background: `linear-gradient(135deg, ${MINT}, ${MINT_DARK})`, color: "#09090d", fontWeight: 700 } as const;

// ── Parser ────────────────────────────────────────────────────────────────────
// Expected format: Username | Password | Email | EmailPass | 2FA
// Only Username and Password are required; other fields are optional.
// Lines starting with '#' are treated as comments and skipped.
function parseLogs(text: string): ParsedLog[] {
  return text
    .split("\n")
    .filter((line) => line.trim() && !line.startsWith("#"))
    .map((line) => {
      const parts = line.split("|").map((p) => p.trim());
      if (parts.length < 2 || !parts[0] || !parts[1]) return null;
      return {
        username:  parts[0],
        password:  parts[1],
        email:     parts[2] || null,
        emailPass: parts[3] || null,
        twoFA:     parts[4] || null,
      };
    })
    .filter((entry): entry is ParsedLog => entry !== null);
}

// ── Parse Preview Table ───────────────────────────────────────────────────────
function PreviewTable({ logs }: { logs: ParsedLog[] }) {
  return (
    <div className="space-y-3">
      {/* Summary bar */}
      <div className="flex items-center gap-3 text-xs font-semibold">
        <span style={{ color: MINT }}>✓ {logs.length} valid</span>
        <span className="text-muted-foreground ml-auto">{logs.length} total rows</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--border)" }}>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: "var(--muted)", borderBottom: "1px solid var(--border)" }}>
              {["#", "Username", "Password", "Email", "Email Pass", "2FA"].map((h) => (
                <th key={h} className="text-left px-3 py-2 font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.map((log, i) => (
              <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                <td className="px-3 py-2 font-mono max-w-[140px] truncate">{log.username}</td>
                <td className="px-3 py-2 font-mono max-w-[120px] truncate text-muted-foreground">••••••••</td>
                <td className="px-3 py-2 text-muted-foreground max-w-[160px] truncate">{log.email || "—"}</td>
                <td className="px-3 py-2 text-muted-foreground max-w-[120px] truncate">{log.emailPass || "—"}</td>
                <td className="px-3 py-2 font-mono text-muted-foreground max-w-[100px] truncate">{log.twoFA || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AdminInventoryPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  // Form state
  const [sessionName, setSessionName] = useState("");
  const [category, setCategory]       = useState<Category>("Facebook");
  async function loadSessions() {
    setLoadingSessions(true);
    try {
      const res = await fetch("/api/admin/marketplace/update-price", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load inventory");
      const logs = (data.logs ?? []) as Array<{ id: string; category: string; createdAt?: string }>;
      const grouped = new Map<string, Session>();
      for (const row of logs) {
        const key = row.category || "Other";
        const prev = grouped.get(key);
        if (!prev) {
          grouped.set(key, {
            id: key.toLowerCase().replace(/\s+/g, "-"),
            name: `${key} Session`,
            category: key,
            uploadedAt: new Date(row.createdAt ?? Date.now()).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" }),
            count: 1,
          });
        } else {
          prev.count += 1;
        }
      }
      setSessions(Array.from(grouped.values()).sort((a, b) => b.count - a.count));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load sessions");
      setSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  }

  useEffect(() => {
    void loadSessions();
  }, []);

  const [rawText, setRawText]         = useState("");
  const [parsed, setParsed]           = useState<ParsedLog[] | null>(null);
  const [uploading, setUploading]     = useState(false);

  function handleParse() {
    if (!rawText.trim()) { toast.error("Paste some log data first."); return; }
    const result = parseLogs(rawText);
    setParsed(result);
    if (result.length === 0) {
      toast.error("No valid rows found — check your format (Username|Password required).");
    } else {
      toast.success(`Parsed ${result.length} valid row${result.length !== 1 ? "s" : ""}.`);
    }
  }

  async function handleUpload() {
    if (!sessionName.trim())            { toast.error("Enter a session name."); return; }
    if (!parsed || parsed.length === 0) { toast.error("Parse the data first."); return; }
    const valid = parsed;

    setUploading(true);

    try {
      const res = await fetch("/api/admin/logs/bulk-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionName: sessionName.trim(),
          category,
          logs: valid.map((l) => ({
            username:  l.username,
            password:  l.password,
            email:     l.email     || undefined,
            emailPass: l.emailPass || undefined,
            twoFA:     l.twoFA     || undefined,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Upload failed");
        return;
      }

      toast.success(data.message);
      if (data.skipped > 0) {
        toast.warning(`${data.skipped} row(s) skipped — missing username or password`);
      }

      setSessionName("");
      setRawText("");
      setParsed(null);
      await loadSessions();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function deleteSession(categoryName: string) {
    try {
      const rows = await fetch("/api/admin/marketplace/update-price", { cache: "no-store" });
      const data = await rows.json();
      const logs = (data.logs ?? []) as Array<{ id: string; category: string }>;
      const target = logs.filter((l) => l.category === categoryName);
      if (target.length === 0) return toast.info("No logs found for this category.");
      await Promise.all(
        target.map((row) =>
          fetch("/api/admin/marketplace/update-price", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "updateItemPrice", logId: row.id, price: 0 }),
          })
        )
      );
      toast.success("Category rows zero-priced. Use Marketplace section for full delete.");
      await loadSessions();
    } catch {
      toast.error("Failed to update session.");
    }
  }

  const totalStock = sessions.reduce((s, sess) => s + sess.count, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
            Inventory Manager
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Bulk upload and manage Social Log sessions
          </p>
        </div>
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold"
          style={{ background: `${MINT}12`, border: `1px solid ${MINT}28`, color: MINT }}
        >
          <Package className="w-3.5 h-3.5" />
          {totalStock} logs in stock
        </div>
      </div>

      {/* Upload Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="w-4 h-4" style={{ color: MINT }} />
            Bulk Upload Logs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Format guide */}
          <div
            className="p-3 rounded-xl flex items-start gap-3 text-xs"
            style={{ background: `${MINT}08`, border: `1px solid ${MINT}20` }}
          >
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: MINT }} />
            <div className="space-y-1">
              <p className="font-semibold" style={{ color: MINT }}>Expected Format (pipe-separated)</p>
              <code className="block font-mono text-muted-foreground leading-relaxed">
                Category | Username | Password | Recovery Email | 2FA Key
              </code>
              <p className="text-muted-foreground">
                Minimum required: <strong>Username | Password</strong>.
                Category, Recovery Email, and 2FA Key are optional.
                Lines starting with <code>#</code> are treated as comments.
              </p>
            </div>
          </div>

          {/* Session Name + Category row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="sessionName">Session Name</Label>
              <Input
                id="sessionName"
                placeholder="e.g. FB Aged Batch — April 2026"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="category">Category</Label>
              <div className="relative">
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category)}
                  className="w-full pl-3 pr-8 py-2 rounded-xl border text-sm font-medium appearance-none cursor-pointer"
                  style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Textarea */}
          <div className="space-y-1.5">
            <Label htmlFor="rawLogs">Paste Log Data</Label>
            <textarea
              id="rawLogs"
              rows={10}
              value={rawText}
              onChange={(e) => { setRawText(e.target.value); setParsed(null); }}
              placeholder={`# Example entries:\nFacebook | john.doe2019 | Fb@Pass99! | recovery@gmail.com | JBSWY3DP\nInstagram | insta_user | Insta#2024 |\njohn.fresh | FreshPass@1`}
              className="w-full px-3 py-2.5 rounded-xl text-sm font-mono resize-y leading-relaxed"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
                minHeight: 200,
                outline: "none",
              }}
            />
            <p className="text-xs text-muted-foreground">
              {rawText.split("\n").filter((l) => l.trim() && !l.trim().startsWith("#")).length} data rows detected
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleParse}
              disabled={!rawText.trim()}
            >
              <FileText className="w-4 h-4 mr-1.5" />
              Parse &amp; Preview
            </Button>
            <Button
              className="flex-1 font-bold"
              style={MINT_BTN}
              onClick={handleUpload}
              disabled={uploading || !parsed || parsed.length === 0}
            >
              {uploading ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-1.5" />Uploading…</>
              ) : (
                <><Upload className="w-4 h-4 mr-1.5" />Upload to Inventory</>
              )}
            </Button>
          </div>

          {/* Parse preview */}
          <AnimatePresence>
            {parsed && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <PreviewTable logs={parsed} />
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Existing Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="w-4 h-4" style={{ color: MINT }} />
            Upload Sessions ({sessions.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loadingSessions ? (
            <p className="text-center text-sm text-muted-foreground py-10">Loading inventory…</p>
          ) : sessions.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-10">No sessions yet — upload your first batch above.</p>
          ) : (
            <div className="divide-y divide-border/40">
              {sessions.map((sess) => (
                <div key={sess.id} className="flex items-center gap-4 px-5 py-4 hover:bg-accent/20 transition-colors">
                  <span className="text-xl flex-shrink-0">{CATEGORY_ICONS[(sess.category as Category)] ?? "🔗"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{sess.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {sess.category} · Uploaded {sess.uploadedAt}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Badge
                      variant="secondary"
                      style={{ background: `${MINT}14`, color: MINT, border: `1px solid ${MINT}28` }}
                    >
                      {sess.count} logs
                    </Badge>
                    <button
                      onClick={() => void deleteSession(sess.category)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                      title="Delete session"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Warning banner */}
      <div
        className="flex items-start gap-3 p-4 rounded-xl text-sm"
        style={{ background: "oklch(0.80 0.15 80 / 0.08)", border: "1px solid oklch(0.80 0.15 80 / 0.25)" }}
      >
        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "oklch(0.82 0.15 80)" }} />
        <p style={{ color: "oklch(0.82 0.15 80)" }}>
          <strong>Admin only.</strong> Uploaded credentials are stored encrypted and delivered to users one-at-a-time upon purchase. Never re-upload duplicate sessions.
        </p>
      </div>
    </div>
  );
}
