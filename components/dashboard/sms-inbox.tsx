"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Copy, Check, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface SmsMessage {
  id: string;
  from: string;
  to: string;
  body: string;
  read: boolean;
  createdAt: Date;
  number: { number: string };
}

interface SmsInboxProps {
  messages: SmsMessage[];
}

export function SmsInbox({ messages }: SmsInboxProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function copyOtp(text: string, id: string) {
    // Extract OTP if possible (digit sequence 4-8 chars)
    const otpMatch = text.match(/\b\d{4,8}\b/);
    const toCopy = otpMatch ? otpMatch[0] : text;
    await navigator.clipboard.writeText(toCopy);
    setCopied(id);
    toast.success(otpMatch ? `OTP ${toCopy} copied!` : "Message copied!");
    setTimeout(() => setCopied(null), 2000);
  }

  const unread = messages.filter((m) => !m.read).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">SMS Inbox</CardTitle>
          <div className="flex items-center gap-2">
            {unread > 0 && (
              <Badge variant="default" className="animate-pulse-ring">
                {unread} new
              </Badge>
            )}
            <Badge variant="secondary">{messages.length} total</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center px-6">
            <div className="p-3 rounded-2xl bg-muted mb-3">
              <MessageSquare className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              No messages yet
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Messages from your active numbers will appear here
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[340px]">
            <div className="divide-y divide-border/30">
              {messages.map((msg, i) => {
                const isExpanded = expanded === msg.id;
                const otpMatch = msg.body.match(/\b\d{4,8}\b/);

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className={`px-4 py-3 hover:bg-accent/20 transition-colors ${
                      !msg.read ? "border-l-2 border-l-primary" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <MessageSquare className="w-3.5 h-3.5 text-primary" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono font-medium text-foreground">
                            {msg.from}
                          </span>
                          <span className="text-[10px] text-muted-foreground">→</span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {msg.number.number}
                          </span>
                          {otpMatch && (
                            <Badge variant="success" className="text-[10px] px-1.5 py-0">
                              OTP: {otpMatch[0]}
                            </Badge>
                          )}
                        </div>

                        <AnimatePresence>
                          <p
                            className={`text-xs text-muted-foreground mt-1 ${
                              isExpanded ? "" : "line-clamp-2"
                            }`}
                          >
                            {msg.body}
                          </p>
                        </AnimatePresence>

                        <div className="flex items-center gap-2 mt-1.5">
                          <Clock className="w-3 h-3 text-muted-foreground/50" />
                          <span className="text-[10px] text-muted-foreground/60">
                            {formatDate(msg.createdAt)}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1 flex-shrink-0">
                        <button
                          onClick={() => copyOtp(msg.body, msg.id)}
                          className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                          title="Copy OTP"
                        >
                          {copied === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        {msg.body.length > 80 && (
                          <button
                            onClick={() =>
                              setExpanded(isExpanded ? null : msg.id)
                            }
                            className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
