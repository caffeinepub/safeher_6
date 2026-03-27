import { Button } from "@/components/ui/button";
import { Loader2, Lock, Shield } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const FEATURES = [
  { icon: "🆘", text: "One-press SOS emergency alerts" },
  { icon: "📍", text: "Real-time location sharing" },
  { icon: "⚠️", text: "Danger zone detection" },
  { icon: "👥", text: "Emergency contact management" },
];

export default function AuthPage() {
  const { login, isLoggingIn, isInitializing } = useInternetIdentity();
  const [clicked, setClicked] = useState(false);

  const handleLogin = () => {
    setClicked(true);
    login();
  };
  const loading = isLoggingIn || isInitializing || clicked;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm flex flex-col items-center gap-8"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-red-800 flex items-center justify-center shadow-sos">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <div className="text-center">
            <h1 className="font-display font-bold text-4xl text-foreground">
              safethem<span className="text-primary">-jay</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Your personal safety companion
            </p>
          </div>
        </div>

        <div className="w-full space-y-3">
          {FEATURES.map((f) => (
            <motion.div
              key={f.text}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 bg-card rounded-xl px-4 py-3 border border-border"
            >
              <span className="text-xl">{f.icon}</span>
              <span className="text-sm text-foreground/90">{f.text}</span>
            </motion.div>
          ))}
        </div>

        <div className="w-full space-y-3">
          <Button
            data-ocid="auth.submit_button"
            onClick={handleLogin}
            disabled={loading}
            className="w-full h-14 text-lg font-display font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl shadow-sos"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Signing in...
              </>
            ) : (
              <>
                <Lock className="w-5 h-5 mr-2" /> Sign in Securely
              </>
            )}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Protected by Internet Identity — no password needed
          </p>
        </div>
      </motion.div>
    </div>
  );
}
