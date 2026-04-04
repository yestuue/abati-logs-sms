"use client";
import { useRef, useState } from "react";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const CATEGORIES = [
  "Facebook",
  "Instagram",
  "Twitter / X",
  "TikTok",
  "Snapchat",
  "Telegram",
  "WhatsApp",
  "Gmail",
  "Yahoo",
  "NordVPN",
  "Other",
];

export function InventoryUpload() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [loading, setLoading] = useState(false);

  const effectiveCategory = category === "Other" ? customCategory : category;

  function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0] ?? null;
    setFile(picked);
  }

  function clearFile() {
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleUpload() {
    if (!file) { toast.error("Please select a .txt file"); return; }
    if (!effectiveCategory.trim()) { toast.error("Please choose or enter a category"); return; }

    setLoading(true);

    const reader = new FileReader();

    reader.onerror = () => {
      toast.error("Could not read file");
      setLoading(false);
    };

    reader.onload = async (e) => {
      const text = e.target?.result as string;

      try {
        const res = await fetch("/api/admin/logs/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: effectiveCategory.trim(),
            fileContent: text,
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

        clearFile();
        setCategory("");
        setCustomCategory("");
      } catch {
        toast.error("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    reader.readAsText(file);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Upload className="w-4 h-4" />
          Bulk Log Upload
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Upload a <code>.txt</code> file. Each line:{" "}
          <code>username|password|email|emailPass|twoFA</code>
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Category selector */}
        <div className="space-y-1.5">
          <Label>Category</Label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => { setCategory(cat); setCustomCategory(""); }}
                className="px-3 py-1 rounded-lg text-xs font-medium transition-all"
                style={
                  category === cat
                    ? {
                        background: "linear-gradient(135deg, oklch(0.68 0.22 278), oklch(0.55 0.24 278))",
                        color: "#fff",
                        boxShadow: "0 2px 8px oklch(0.68 0.22 278 / 0.30)",
                      }
                    : {
                        background: "var(--muted)",
                        color: "var(--muted-foreground)",
                        border: "1px solid var(--border)",
                      }
                }
              >
                {cat}
              </button>
            ))}
          </div>

          {category === "Other" && (
            <Input
              placeholder="Enter custom category…"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              className="mt-2"
            />
          )}
        </div>

        {/* File picker */}
        <div className="space-y-1.5">
          <Label>Text File</Label>
          {file ? (
            <div
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: "var(--muted)", border: "1px solid var(--border)" }}
            >
              <FileText className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-sm flex-1 truncate">{file.name}</span>
              <span className="text-xs text-muted-foreground flex-shrink-0">
                {(file.size / 1024).toFixed(1)} KB
              </span>
              <button
                type="button"
                onClick={clearFile}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full flex flex-col items-center gap-2 p-6 rounded-xl border-2 border-dashed transition-colors hover:border-primary/50 hover:bg-primary/5"
              style={{ borderColor: "var(--border)" }}
            >
              <Upload className="w-6 h-6 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Click to select a <strong>.txt</strong> file
              </span>
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".txt,text/plain"
            onChange={handleFilePick}
            className="hidden"
          />
        </div>

        <Button
          className="w-full"
          variant="brand"
          onClick={handleUpload}
          disabled={loading || !file || !effectiveCategory.trim()}
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
          ) : (
            <><Upload className="w-4 h-4" /> Upload Logs</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
