import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Button } from "@/components/ui/button";
import { Code2, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAdmin = useAdminCheck();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const navLinks = user
    ? [
        { to: "/dashboard", label: "Dashboard" },
        { to: "/generate", label: "Generate" },
        { to: "/history", label: "History" },
        { to: "/profile", label: "Profile" },
        ...(isAdmin ? [{ to: "/admin", label: "Admin" }] : []),
      ]
    : [
        { to: "/pricing", label: "Pricing" },
      ];

  return (
    <nav className="sticky top-0 z-50 glass border-b border-border/50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 text-foreground">
          <Code2 className="h-7 w-7 text-primary" />
          <span className="text-lg font-bold tracking-tight">
            Code <span className="text-gradient">AI</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary ${
                location.pathname === link.to ? "bg-secondary text-primary" : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              Logout
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
                Login
              </Button>
              <Button size="sm" onClick={() => navigate("/register")} className="bg-gradient-primary text-primary-foreground hover:opacity-90">
                Get Started
              </Button>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="border-t border-border/50 bg-card p-4 md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {user ? (
            <button
              className="mt-2 block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-destructive hover:bg-secondary"
              onClick={() => { handleSignOut(); setMobileOpen(false); }}
            >
              Logout
            </button>
          ) : (
            <div className="mt-2 flex gap-2">
              <Button variant="ghost" size="sm" className="flex-1" onClick={() => { navigate("/login"); setMobileOpen(false); }}>
                Login
              </Button>
              <Button size="sm" className="flex-1 bg-gradient-primary text-primary-foreground" onClick={() => { navigate("/register"); setMobileOpen(false); }}>
                Get Started
              </Button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
