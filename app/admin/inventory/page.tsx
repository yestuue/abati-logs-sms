"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, FileText, Check, X, AlertTriangle, Trash2,
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
  line: number;
  category: string;
  username: string;
  password: string;
  recoveryEmail: string;
  twoFAKey: string;
  raw: string;
  valid: boolean;
  error?: string;
}

interface Session {
  id: string;
  name: string;
  category: Category;
  uploadedAt: string;
  count: number;
  logs: ParsedLog[];
}

// ── Mock sessions already uploaded ────────────────────────────────────────────
const INITIAL_SESSIONS: Session[] = [
  {
    id: "sess-001",
    name: "FB Aged Batch — March 2026",
    category: "Facebook",
    uploadedAt: "Mar 28, 2026",
    count: 47,
    logs: [],
  },
  {
    id: "sess-002",
    name: "IG Premium — April 2026",
    category: "Instagram",
    uploadedAt: "Apr 1, 2026",
    count: 23,
    logs: [],
  },
];

const CATEGORIES: Category[] = ["Facebook", "Instagram", "TikTok", "Twitter/X", "Gmail", "LinkedIn", "Snapchat", "Other"];
const CATEGORY_ICONS: Record<Category, string> = {
  Facebook: "📘", Instagram: "📸", TikTok: "🎵", "Twitter/X": "🐦",
  Gmail: "📧", LinkedIn: "💼", Snapchat: "👻", Other: "🔗",
};

const MINT      = "oklch(0.80 0.19 162)";
const MINT_DARK = "oklch(0.68 0.17 162)";
const MINT_BTN  = { background: `linear-gradient(135deg, ${MINT}, ${MINT_DARK})`, color: "#09090d", fontWeight: 700 } as const;

// ── Parser ────────────────────────────────────────────────────────────────────
// Expected format: Category | Username | Password | Recovery Email | 2FA Key
// Category and 2FA Key are optional — at minimum Username | Password must be present
function parseLogs(raw: string): ParsedLog[] {
  return raw
    .split("\n")
    .map((line, i) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"))
    .map((line, i) => {
      const parts = line.split("|").map((p) => p.trim());

      if (parts.length < 2) {
        return { line: i + 1, category: "", username: "", password: "", recoveryEmail: "", twoFAKey: "", raw: line, valid: false, error: "Must have at least Username | Password" };
      }

      // Support 2-field (user|pass), 3-field (+recovery), 4-field (+2fa), 5-field (cat+all)
      let category = "", username = "", password = "", recoveryEmail = "", twoFAKey = "";

      if (parts.length >= 5) {
        [category, username, password, recoveryEmail, twoFAKey] = parts;
      } else if (parts.length === 4) {
        [username, password, recoveryEmail, twoFAKey] = parts;
      } else if (parts.length === 3) {
        [username, password, recoveryEmail] = parts;
      } else {
        [username, password] = parts;
      }

      if (!username || !password) {
        return { line: i + 1, category, username, password, recoveryEmail, twoFAKey, raw: line, valid: false, error: "Username and Password are required" };
      }

      return { line: i + 1, category, username, password, recoveryEmail, twoFAKey, raw: line, valid: true };
    });
}

// ── Parse Preview Table ───────────────────────────────────────────────────────
function PreviewTable({ logs }: { logs: ParsedLog[] }) {
  const valid   = logs.filter((l) => l.valid).length;
  const invalid = logs.filter((l) => !l.valid).length;

  return (
    <div className="space-y-3">
      {/* Summary bar */}
      <div className="flex items-center gap-3 text-xs font-semibold">
        <span style={{ color: MINT }}>✓ {valid} valid</span>
        {invalid > 0 && <span className="text-red-400">✗ {invalid} errors</span>}
        <span className="text-muted-foreground ml-auto">{logs.length} total rows</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--border)" }}>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: "var(--muted)", borderBottom: "1px solid var(--border)" }}>
              {["#", "Status", "Username", "Password", "Recovery Email", "2FA Key"].map((h) => (
                <th key={h} className="text-left px-3 py-2 font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr
                key={log.line}
                style={{
                  background: log.valid ? "transparent" : "oklch(0.53 0.22 27 / 0.06)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <td className="px-3 py-2 text-muted-foreground">{log.line}</td>
                <td className="px-3 py-2">
                  {log.valid
                    ? <span style={{ color: MINT }}>✓</span>
                    : <span title={log.error} className="text-red-400 cursor-help">✗</span>}
                </td>
                <td className="px-3 py-2 font-mono max-w-[140px] truncate">{log.username || "—"}</td>
                <td className="px-3 py-2 font-mono max-w-[120px] truncate text-muted-foreground">{log.password ? "••••••••" : "—"}</td>
                <td className="px-3 py-2 text-muted-foreground max-w-[160px] truncate">{log.recoveryEmail || "—"}</td>
                <td className="px-3 py-2 font-mono text-muted-foreground max-w-[100px] truncate">{log.twoFAKey || "—"}</td>
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
  const [sessions, setSessions] = useState<Session[]>(INITIAL_SESSIONS);

  // Form state
  const [sessionName, setSessionName] = useState("");
  const [category, setCategory]       = useState<Category>("Facebook");
  const [rawText, setRawText]         = useState("");
  const [parsed, setParsed]           = useState<ParsedLog[] | null>(null);
  const [uploading, setUploading]     = useState(false);

  function handleParse() {
    if (!rawText.trim()) { toast.error("Paste some log data first."); return; }
    const result = parseLogs(rawText);
    setParsed(result);
    const valid = result.filter((l) => l.valid).length;
    if (valid === 0) {
      toast.error("No valid rows found — check your format.");
    } else {
      toast.success(`Parsed ${result.length} rows — ${valid} valid, ${result.length - valid} errors.`);
    }
  }

  async function handleUpload() {
    if (!sessionName.trim())    { toast.error("Enter a session name."); return; }
    if (!parsed || parsed.length === 0) { toast.error("Parse the data first."); return; }
    const valid = parsed.filter((l) => l.valid);
    if (valid.length === 0)    { toast.error("No valid rows to upload."); return; }

    setUploading(true);
    await new Promise((r) => setTimeout(r, 1600)); // simulate API call

    const newSession: Session = {
      id: `sess-${Date.now()}`,
      name: sessionName.trim(),
      category,
      uploadedAt: new Date().toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" }),
      count: valid.length,
      logs: valid,
    };

    setSessions((prev) => [newSession, ...prev]);
    setSessionName("");
    setRawText("");
    setParsed(null);
    setUploading(false);
    toast.success(`${valid.length} logs uploaded to "${newSession.name}"`);
  }

  function deleteSession(id: string) {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    toast.success("Session deleted.");
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
              disabled={uploading || !parsed || parsed.filter((l) => l.valid).length === 0}
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
          {sessions.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-10">No sessions yet — upload your first batch above.</p>
          ) : (
            <div className="divide-y divide-border/40">
              {sessions.map((sess) => (
                <div key={sess.id} className="flex items-center gap-4 px-5 py-4 hover:bg-accent/20 transition-colors">
                  <span className="text-xl flex-shrink-0">{CATEGORY_ICONS[sess.category]}</span>
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
                      onClick={() => deleteSession(sess.id)}
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
