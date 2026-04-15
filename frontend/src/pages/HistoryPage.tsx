import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Eye, X, Code2 } from "lucide-react";
import Editor from "@monaco-editor/react";
import { motion } from "framer-motion";

interface Prompt {
  id: string;
  prompt_text: string;
  language: string;
  generated_code: string | null;
  created_at: string;
}

const PAGE_SIZE = 10;

export default function HistoryPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPrompts = async (pageNum: number) => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("prompts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);
    if (data) {
      setPrompts(data);
      setHasMore(data.length === PAGE_SIZE);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPrompts(page);
  }, [user, page]);

  const handleDelete = async (id: string) => {
    await supabase.from("prompts").delete().eq("id", id);
    toast({ title: "Prompt deleted" });
    fetchPrompts(page);
  };

  const LANG_MAP: Record<string, string> = { python: "python", javascript: "javascript", java: "java", cpp: "cpp", typescript: "typescript" };

  return (
    <div className="container mx-auto px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-foreground">
          <Code2 className="inline h-7 w-7 text-primary mr-2" />
          Prompt <span className="text-gradient">History</span>
        </h1>
        <p className="mt-2 text-muted-foreground">View and manage your generated code.</p>
      </motion.div>

      <div className="mt-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : prompts.length === 0 ? (
          <div className="rounded-xl border border-border/50 bg-card p-12 text-center text-muted-foreground">
            No history yet. Generate some code first!
          </div>
        ) : (
          <div className="space-y-3">
            {prompts.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl border border-border/50 bg-card p-4 hover:border-primary/30 transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{p.prompt_text}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {p.language} · {new Date(p.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="ml-4 flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setSelectedPrompt(p)}>
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(p.id)} className="text-destructive hover:text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        <div className="mt-6 flex justify-center gap-2">
          <Button variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button>
          <Button variant="outline" disabled={!hasMore} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      </div>

      {/* Code viewer modal */}
      {selectedPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl rounded-xl border border-border/50 bg-card">
            <div className="flex items-center justify-between border-b border-border/50 p-4">
              <div>
                <h3 className="font-semibold text-foreground">{selectedPrompt.prompt_text}</h3>
                <p className="text-xs text-muted-foreground mt-1">{selectedPrompt.language} · {new Date(selectedPrompt.created_at).toLocaleString()}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedPrompt(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="overflow-hidden rounded-b-xl">
              <Editor
                height="400px"
                language={LANG_MAP[selectedPrompt.language] || "plaintext"}
                value={selectedPrompt.generated_code || "// No code generated"}
                theme="vs-dark"
                options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13, fontFamily: "'JetBrains Mono', monospace", scrollBeyondLastLine: false, padding: { top: 16 } }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
