import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Code2, Zap, Clock, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface Prompt {
  id: string;
  prompt_text: string;
  language: string;
  created_at: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recentPrompts, setRecentPrompts] = useState<Prompt[]>([]);
  const [dailyCount, setDailyCount] = useState(0);
  const [profileName, setProfileName] = useState("");

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // Fetch profile name
      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("user_id", user.id)
        .single();
      if (profile) setProfileName(profile.name || user.email?.split("@")[0] || "User");

      // Fetch recent prompts
      const { data: prompts } = await supabase
        .from("prompts")
        .select("id, prompt_text, language, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (prompts) setRecentPrompts(prompts);

      // Get daily count
      const { data: countData } = await supabase.rpc("get_daily_prompt_count", { _user_id: user.id });
      if (countData !== null) setDailyCount(countData);
    };

    fetchData();
  }, [user]);

  return (
    <div className="container mx-auto px-4 py-10 bg-background text-foreground">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, <span className="text-gradient">{profileName}</span>
        </h1>
        <p className="mt-2 text-muted-foreground">Here's your activity overview.</p>
      </motion.div>

      {/* Stats cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border/50 bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2"><Zap className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Today's Usage</p>
              <p className="text-2xl font-bold text-foreground">{dailyCount} / 5</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-accent/10 p-2"><Code2 className="h-5 w-5 text-accent" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Total Prompts</p>
              <p className="text-2xl font-bold text-foreground">{recentPrompts.length > 0 ? "View All" : "0"}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2"><Clock className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Plan</p>
              <p className="text-2xl font-bold text-foreground">Free</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick action */}
      <div className="mt-8">
        <Button
          size="lg"
          className="bg-gradient-primary text-primary-foreground hover:opacity-90 glow"
          onClick={() => navigate("/generate")}
        >
          Generate Code <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {/* Recent prompts */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold text-foreground mb-4">Recent Prompts</h2>
        {recentPrompts.length === 0 ? (
          <div className="rounded-xl border border-border/50 bg-card p-8 text-center text-muted-foreground">
            No prompts yet. Start generating code!
          </div>
        ) : (
          <div className="space-y-3">
            {recentPrompts.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl border border-border/50 bg-card p-4 hover:border-primary/30 transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{p.prompt_text}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {p.language} · {new Date(p.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="ml-4 rounded bg-primary/10 px-2 py-1 text-xs font-mono text-primary">
                  {p.language}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
