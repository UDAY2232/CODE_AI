import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy, Download, FileText, Sparkles, BookOpen } from "lucide-react";
import Editor from "@monaco-editor/react";
import { jsPDF } from "jspdf";
import { motion } from "framer-motion";

const LANGUAGES = [
  { value: "python", label: "Python", ext: ".py", monacoLang: "python" },
  { value: "javascript", label: "JavaScript", ext: ".js", monacoLang: "javascript" },
  { value: "java", label: "Java", ext: ".java", monacoLang: "java" },
  { value: "cpp", label: "C++", ext: ".cpp", monacoLang: "cpp" },
  { value: "typescript", label: "TypeScript", ext: ".ts", monacoLang: "typescript" },
];

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export default function CodeGeneratorPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState("vs-light");
  const [explanation, setExplanation] = useState("");
  const [explaining, setExplaining] = useState(false);
  const codeRef = useRef<HTMLDivElement>(null);
  const explanationRef = useRef<HTMLDivElement>(null);

  const langConfig = LANGUAGES.find((l) => l.value === language)!;

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({ title: "Enter a prompt", variant: "destructive" });
      return;
    }
    if (!user) return;

    setLoading(true);
    setCode("");
    let timeoutId: NodeJS.Timeout | null = null;

    try {
      timeoutId = setTimeout(() => {
        setLoading(false);
        toast({ title: "Timeout", description: "Code generation took too long.", variant: "destructive" });
      }, 30000); // 30 seconds

      const resp = await fetch(`${BACKEND_URL}/api/generate-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ prompt: prompt.trim(), language }),
      });

      if (!resp.ok) {
        const err = await resp.json();
        toast({ title: "Error", description: err.error || "Generation failed", variant: "destructive" });
        setLoading(false);
        if (timeoutId) clearTimeout(timeoutId);
        return;
      }

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              accumulated += content;
              setCode(accumulated);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Save to database
      await supabase.from("prompts").insert({
        user_id: user.id,
        prompt_text: prompt.trim(),
        language,
        generated_code: accumulated,
      });

      // Auto-scroll
      setTimeout(() => {
        codeRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 300);
    } catch (e) {
      toast({ title: "Error", description: "Failed to generate code", variant: "destructive" });
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    toast({ title: "Copied to clipboard!" });
  };

  const handleDownloadFile = () => {
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `codegenie-output${langConfig.ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFont("courier", "normal");
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(code, 180);
    doc.text(lines, 15, 15);
    doc.save("codegenie-output.pdf");
  };

  const handleExplain = async () => {
    if (!code.trim()) return;
    setExplaining(true);
    setExplanation("");
    try {
      const resp = await fetch(`${BACKEND_URL}/api/explain-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ code }),
      });
      if (!resp.ok) {
        const err = await resp.json();
        toast({ title: "Error", description: err.error || "Explanation failed", variant: "destructive" });
        return;
      }
      const data = await resp.json();
      setExplanation(data.explanation);
      setTimeout(() => {
        explanationRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 300);
    } catch {
      toast({ title: "Error", description: "Failed to explain code", variant: "destructive" });
    } finally {
      setExplaining(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-10 bg-background text-foreground">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-foreground">
          <Sparkles className="inline h-7 w-7 text-primary mr-2" />
          Code <span className="text-gradient">Generator</span>
        </h1>
        <p className="mt-2 text-muted-foreground">Describe what you need and let AI write the code.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        {/* Left: Input panel */}
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Language</label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="bg-card border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Your Prompt</label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Write a Python function to sort a list using merge sort..."
              className="min-h-[200px] bg-card border-border font-mono text-sm resize-none text-foreground"
              maxLength={2000}
            />
            <p className="mt-1 text-xs text-muted-foreground">{prompt.length}/2000</p>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90 glow"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Code
              </>
            )}
          </Button>
        </div>

        {/* Right: Output panel */}
        <div ref={codeRef} className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-foreground">Generated Code</label>
            {code && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  <Copy className="mr-1 h-3 w-3" /> Copy
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownloadFile}>
                  <Download className="mr-1 h-3 w-3" /> {langConfig.ext}
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                  <FileText className="mr-1 h-3 w-3" /> PDF
                </Button>
              </div>
            )}
          </div>
          <div className="rounded-xl border border-border/50 overflow-hidden glow bg-card flex-1 flex items-center justify-center">
            <Editor
              height="450px"
              language={langConfig.monacoLang}
              value={code || (loading ? "Loading..." : "// Your generated code will appear here...")}
              theme={theme}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: "'JetBrains Mono', monospace",
                scrollBeyondLastLine: false,
                padding: { top: 16 },
                wordWrap: "on",
              }}
            />
          </div>
          {/* Explain button */}
          {code && (
            <div className="mt-3">
              <Button
                onClick={handleExplain}
                disabled={explaining}
                variant="outline"
                className="w-full"
              >
                {explaining ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Explaining...</>
                ) : (
                  <><BookOpen className="mr-2 h-4 w-4" /> Explain Code</>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Explanation section */}
      {explanation && (
        <motion.div
          ref={explanationRef}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 rounded-xl border border-border/50 bg-card p-6"
        >
          <h2 className="text-lg font-semibold text-foreground mb-3">
            <BookOpen className="inline h-5 w-5 text-primary mr-2" />
            Code Explanation
          </h2>
          <div className="whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed font-mono">
            {explanation}
          </div>
        </motion.div>
      )}
    </div>
  );
}
