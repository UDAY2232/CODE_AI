import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Code2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: "Password too short", description: "Must be at least 6 characters", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password, name);
    setLoading(false);
    if (error) {
      toast({ title: "Registration failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Check your email", description: "We sent you a confirmation link to verify your account." });
      navigate("/login");
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
          <h1 className="mt-6 text-2xl font-bold text-foreground">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">Start generating code for free</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} className="mt-1 bg-card border-border" placeholder="Your name" />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 bg-card border-border" placeholder="you@example.com" />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 bg-card border-border" placeholder="••••••••" />
          </div>
          <Button type="submit" className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
