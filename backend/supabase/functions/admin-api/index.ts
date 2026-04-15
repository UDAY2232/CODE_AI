import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify JWT and admin role
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role using service role client
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden: admin only" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const path = url.pathname.split("/").filter(Boolean);
    // Path after /admin-api: e.g. ["admin-api", "users"] or ["admin-api", "users", "<id>"]
    const resource = path[1]; // "users" or "prompts"
    const resourceId = path[2]; // optional ID

    // GET /admin-api/users
    if (req.method === "GET" && resource === "users") {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, name, email, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get roles for all users
      const { data: roles } = await supabase.from("user_roles").select("user_id, role");
      const roleMap = new Map<string, string>();
      roles?.forEach((r: any) => roleMap.set(r.user_id, r.role));

      const users = data?.map((u: any) => ({
        ...u,
        role: roleMap.get(u.user_id) || "user",
      }));

      return new Response(JSON.stringify({ users }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // DELETE /admin-api/users/<id>
    if (req.method === "DELETE" && resource === "users" && resourceId) {
      // Don't allow self-deletion
      if (resourceId === user.id) {
        return new Response(JSON.stringify({ error: "Cannot delete yourself" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { error } = await supabase.auth.admin.deleteUser(resourceId);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET /admin-api/prompts
    if (req.method === "GET" && resource === "prompts") {
      const { data, error } = await supabase
        .from("prompts")
        .select("id, prompt_text, language, created_at, user_id")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      // Get user emails
      const userIds = [...new Set(data?.map((p: any) => p.user_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, email")
        .in("user_id", userIds);

      const emailMap = new Map<string, string>();
      profiles?.forEach((p: any) => emailMap.set(p.user_id, p.email));

      const prompts = data?.map((p: any) => ({
        ...p,
        user_email: emailMap.get(p.user_id) || "unknown",
      }));

      return new Response(JSON.stringify({ prompts }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // DELETE /admin-api/prompts/<id>
    if (req.method === "DELETE" && resource === "prompts" && resourceId) {
      const { error } = await supabase.from("prompts").delete().eq("id", resourceId);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
