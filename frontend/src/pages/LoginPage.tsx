import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Code2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <Code2 className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">Code<span className="text-gradient">Genie</span></span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-foreground">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to your account</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 bg-card border-border" placeholder="you@example.com" />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 bg-card border-border" placeholder="••••••••" />
          </div>
          <Button type="submit" className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/register" className="text-primary hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
