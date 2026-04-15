import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Shield, Users, Code2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface AdminUser {
  user_id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

interface AdminPrompt {
  id: string;
  prompt_text: string;
  language: string;
  user_email: string;
  created_at: string;
}

const API_BASE = `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api/admin`;

export default function AdminDashboardPage() {
  const { session } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [prompts, setPrompts] = useState<AdminPrompt[]>([]);
  const [loading, setLoading] = useState(true);

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session?.access_token}`,
  };

  const fetchUsers = async () => {
    const resp = await fetch(`${API_BASE}/users`, { headers });
    if (!resp.ok) throw new Error("Failed to fetch users");
    const data = await resp.json();
    setUsers(data.users || []);
  };

  const fetchPrompts = async () => {
    const resp = await fetch(`${API_BASE}/prompts`, { headers });
    if (!resp.ok) throw new Error("Failed to fetch prompts");
    const data = await resp.json();
    setPrompts(data.prompts || []);
  };

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    Promise.all([fetchUsers(), fetchPrompts()])
      .catch(() => toast({ title: "Error loading admin data", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [session]);

  const deleteUser = async (userId: string) => {
    if (!confirm("Delete this user and all their data?")) return;
    try {
      const resp = await fetch(`${API_BASE}/users/${userId}`, { method: "DELETE", headers });
      if (!resp.ok) throw new Error();
      toast({ title: "User deleted" });
      setUsers((prev) => prev.filter((u) => u.user_id !== userId));
    } catch {
      toast({ title: "Failed to delete user", variant: "destructive" });
    }
  };

  const deletePrompt = async (promptId: string) => {
    try {
      const resp = await fetch(`${API_BASE}/prompts/${promptId}`, { method: "DELETE", headers });
      if (!resp.ok) throw new Error();
      toast({ title: "Prompt deleted" });
      setPrompts((prev) => prev.filter((p) => p.id !== promptId));
    } catch {
      toast({ title: "Failed to delete prompt", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-foreground">
          <Shield className="inline h-7 w-7 text-primary mr-2" />
          Admin <span className="text-gradient">Dashboard</span>
        </h1>
        <p className="mt-2 text-muted-foreground">Manage users and prompts.</p>
      </motion.div>

      <Tabs defaultValue="users" className="mt-8">
        <TabsList className="bg-card border border-border/50">
          <TabsTrigger value="users"><Users className="mr-1 h-4 w-4" /> Users ({users.length})</TabsTrigger>
          <TabsTrigger value="prompts"><Code2 className="mr-1 h-4 w-4" /> Prompts ({prompts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.user_id}>
                    <TableCell className="font-medium text-foreground">{u.name || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <span className={`rounded px-2 py-0.5 text-xs font-medium ${u.role === "admin" ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}>
                        {u.role}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{new Date(u.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {u.role !== "admin" && (
                        <Button variant="ghost" size="sm" onClick={() => deleteUser(u.user_id)} className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="prompts" className="mt-4">
          <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prompt</TableHead>
                  <TableHead>Language</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prompts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="max-w-xs truncate font-medium text-foreground">{p.prompt_text}</TableCell>
                    <TableCell><span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-mono text-primary">{p.language}</span></TableCell>
                    <TableCell className="text-muted-foreground text-sm">{p.user_email}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{new Date(p.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => deletePrompt(p.id)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
