import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAIL = "iowfoai@gmail.com";

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ticketId, type } = await req.json();
    console.log(`Processing support notification: ${type} for ticket ${ticketId}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch ticket details
    const { data: ticket, error: ticketError } = await supabase
      .from("support_tickets")
      .select(`
        *,
        profiles:user_id (full_name, email)
      `)
      .eq("id", ticketId)
      .single();

    if (ticketError || !ticket) {
      throw new Error("Failed to fetch ticket details");
    }

    if (type === "new_ticket") {
      // Notify admin about new ticket
      const emailResponse = await resend.emails.send({
        from: "ExpertGate Support <support@expertgate.cc>",
        to: [ADMIN_EMAIL],
        subject: `New Support Ticket: ${ticket.subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">New Support Ticket</h1>
            <p>A new support ticket has been submitted:</p>
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Subject:</strong> ${ticket.subject}</p>
              <p><strong>From:</strong> ${ticket.profiles?.full_name} (${ticket.profiles?.email})</p>
              <p><strong>Created:</strong> ${new Date(ticket.created_at).toLocaleString()}</p>
            </div>
            <p>
              <a href="https://expertgate.cc/admin-panel" 
                 style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                View in Admin Panel
              </a>
            </p>
          </div>
        `,
      });

      console.log("Admin notification sent:", emailResponse);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in send-support-notification:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
