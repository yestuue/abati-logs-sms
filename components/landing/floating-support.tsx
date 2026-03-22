"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Users, Headphones } from "lucide-react";

export function FloatingSupport() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-24 right-4 lg:bottom-8 lg:right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.92 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl shadow-2xl overflow-hidden w-64"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            {/* Header */}
            <div
              className="px-4 py-3 flex items-center gap-3"
              style={{ background: "#00E5A0" }}
            >
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Headphones className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#09090d]">Abati Support</p>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-[#09090d] rounded-full opacity-60 animate-pulse" />
                  <p className="text-[11px] text-[#09090d] opacity-70">Online — replies in minutes</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-4 space-y-2">
              <p className="text-xs text-muted-foreground mb-3">
                How can we help you today?
              </p>

              <a
                href="https://wa.me/9049386397?text=Hi%2C%20I%20need%20help%20with%20Abati%20Logs"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl transition-all hover:scale-[1.02] active:scale-95"
                style={{ background: "rgba(0,229,160,0.08)", border: "1px solid rgba(0,229,160,0.20)" }}
              >
                <MessageCircle className="w-4 h-4 flex-shrink-0" style={{ color: "#00E5A0" }} />
                <div>
                  <p className="text-sm font-semibold">Chat with Us</p>
                  <p className="text-[11px] text-muted-foreground">WhatsApp — fastest response</p>
                </div>
              </a>

              <a
                href="https://chat.whatsapp.com/H3gMVzCwe5sFDYFb0HoKGL"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl transition-all hover:scale-[1.02] active:scale-95"
                style={{ background: "rgba(0,229,160,0.05)", border: "1px solid var(--border)" }}
              >
                <Users className="w-4 h-4 flex-shrink-0" style={{ color: "#00E5A0" }} />
                <div>
                  <p className="text-sm font-semibold">Join Community</p>
                  <p className="text-[11px] text-muted-foreground">WhatsApp group — tips & updates</p>
                </div>
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <motion.button
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 rounded-full shadow-2xl flex items-center justify-center relative"
        style={{ background: "#00E5A0" }}
        aria-label="Open support"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <X className="w-6 h-6 text-[#09090d]" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <MessageCircle className="w-6 h-6 text-[#09090d]" />
            </motion.div>
          )}
        </AnimatePresence>
        {/* Pulse ring */}
        {!open && (
          <span
            className="absolute inset-0 rounded-full animate-ping"
            style={{ background: "rgba(0,229,160,0.4)" }}
          />
        )}
      </motion.button>
    </div>
  );
}
