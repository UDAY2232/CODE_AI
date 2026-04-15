import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Loader2, User } from "lucide-react";
import { motion } from "framer-motion";

export default function ProfilePage() {
    // Theme selector logic
    const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
    useEffect(() => {
      document.body.classList.remove("dark", "light");
      document.body.classList.add(theme);
      localStorage.setItem("theme", theme);
    }, [theme]);
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("name").eq("user_id", user.id).single().then(({ data }) => {
      if (data) setName(data.name || "");
    });
  }, [user]);

  const handleUpdateProfile = async () => {
    if (!user) return;
    setLoading(true);
    await supabase.from("profiles").update({ name }).eq("user_id", user.id);
    toast({ title: "Profile updated" });
    setLoading(false);
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast({ title: "Password too short", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password updated" });
      setNewPassword("");
    }
    setLoading(false);
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure? This action cannot be undone.")) return;
    setDeleting(true);
    // Sign out - actual deletion requires admin. For now, just sign out.
    await signOut();
    navigate("/");
    toast({ title: "Signed out. Contact support to delete your account." });
  };

  return (
    <div className="container mx-auto max-w-lg px-4 py-10 bg-background text-foreground">
      {/* Theme selector */}
      <div className="mb-8">
        <label className="mb-2 block text-sm font-medium">Theme</label>
        <select
          value={theme}
          onChange={e => setTheme(e.target.value)}
          className="border rounded px-2 py-1 bg-card"
          style={{ minWidth: 120 }}
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-foreground">
          <User className="inline h-7 w-7 text-primary mr-2" />
          <span className="text-gradient">Profile</span>
        </h1>
        <p className="mt-2 text-muted-foreground">{user?.email}</p>
      </motion.div>

      <div className="mt-8 space-y-8">
        {/* Update name */}
        <div className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
          <h2 className="font-semibold text-foreground">Display Name</h2>
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 bg-background border-border" />
          </div>
          <Button onClick={handleUpdateProfile} disabled={loading} className="bg-gradient-primary text-primary-foreground hover:opacity-90">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
          </Button>
        </div>

        {/* Change password */}
        <div className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
          <h2 className="font-semibold text-foreground">Change Password</h2>
          <div>
            <Label htmlFor="newPassword">New Password</Label>
            <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1 bg-background border-border" placeholder="••••••••" />
          </div>
          <Button onClick={handleChangePassword} disabled={loading} variant="outline">
            Update Password
          </Button>
        </div>

        {/* Delete account */}
        <div className="rounded-xl border border-destructive/30 bg-card p-6 space-y-4">
          <h2 className="font-semibold text-destructive">Danger Zone</h2>
          <p className="text-sm text-muted-foreground">Deleting your account will remove all your data permanently.</p>
          <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleting}>
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete Account"}
          </Button>
        </div>
      </div>
    </div>
  );
}
