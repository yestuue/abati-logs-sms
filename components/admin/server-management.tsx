"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Server, Power, Globe, Flag, Phone, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { ServerConfig } from "@prisma/client";

interface ServerManagementProps {
  configs: ServerConfig[];
  stats: {
    SERVER1: { total: number; assigned: number };
    SERVER2: { total: number; assigned: number };
  };
}

const SERVER_META = {
  SERVER1: {
    icon: "🇺🇸",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    description: "USA phone numbers (+1). Best for US-based verification platforms.",
  },
  SERVER2: {
    icon: "🌍",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    description: "Global numbers from 50+ countries. Supports international OTP flows.",
  },
};

export function ServerManagement({ configs, stats }: ServerManagementProps) {
  const router = useRouter();
  const [states, setStates] = useState<Record<string, boolean>>(
    Object.fromEntries(configs.map((c) => [c.server, c.isEnabled]))
  );
  const [loading, setLoading] = useState<string | null>(null);

  async function toggleServer(server: string, enabled: boolean) {
    setLoading(server);
    try {
      const res = await fetch("/api/admin/servers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ server, isEnabled: enabled }),
      });
      if (!res.ok) throw new Error();
      setStates((prev) => ({ ...prev, [server]: enabled }));
      toast.success(
        `${server === "SERVER1" ? "Server 1 (USA)" : "Server 2 (Global)"} ${
          enabled ? "enabled" : "disabled"
        }`
      );
      router.refresh();
    } catch {
      toast.error("Failed to update server status");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {configs.map((cfg, i) => {
        const meta = SERVER_META[cfg.server as keyof typeof SERVER_META];
        const stat = stats[cfg.server as keyof typeof stats];
        const isOn = states[cfg.server] ?? cfg.isEnabled;

        return (
          <motion.div
            key={cfg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className={`border-2 transition-all duration-300 ${isOn ? meta.border : "border-border/30"}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl ${meta.bg} flex items-center justify-center text-xl`}>
                      {meta.icon}
                    </div>
                    <div>
                      <CardTitle className="text-base">{cfg.name}</CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        {meta.description}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={isOn ? "success" : "secondary"}>
                    {isOn ? "Online" : "Offline"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-muted/50 border border-border/30">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Total Numbers</span>
                    </div>
                    <p className="text-xl font-bold text-foreground">{stat?.total ?? 0}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/50 border border-border/30">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Users className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Assigned</span>
                    </div>
                    <p className="text-xl font-bold text-foreground">{stat?.assigned ?? 0}</p>
                  </div>
                </div>

                {/* Toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/20">
                  <div className="flex items-center gap-2">
                    <Power className={`w-4 h-4 ${isOn ? "text-emerald-400" : "text-muted-foreground"}`} />
                    <div>
                      <Label className="text-sm font-medium text-foreground">
                        {isOn ? "Server is Online" : "Server is Offline"}
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {isOn
                          ? "Users can purchase numbers from this server"
                          : "No new purchases allowed from this server"}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={isOn}
                    disabled={loading === cfg.server}
                    onCheckedChange={(v) => toggleServer(cfg.server, v)}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
