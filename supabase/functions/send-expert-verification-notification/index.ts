import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { expertId, approved } = await req.json();
    console.log(`Processing expert verification notification for ${expertId}, approved: ${approved}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch expert profile
    const { data: expert, error: expertError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", expertId)
      .single();

    if (expertError || !expert) {
      throw new Error("Failed to fetch expert details");
    }

    const subject = approved 
      ? "Your ExpertGate Account Has Been Verified!" 
      : "ExpertGate Account Verification Update";

    const html = approved
      ? `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #22c55e;">Congratulations, ${expert.full_name}!</h1>
          <p>Your expert account on ExpertGate has been verified.</p>
          <p>You can now:</p>
          <ul>
            <li>Receive interview requests from researchers</li>
            <li>Connect with other experts</li>
            <li>Build your professional network</li>
          </ul>
          <p>
            <a href="https://expertgate.cc/expert-home" 
               style="background-color: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Go to Your Dashboard
            </a>
          </p>
          <p>Thank you for joining ExpertGate!</p>
        </div>
      `
      : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #ef4444;">Verification Update</h1>
          <p>Dear ${expert.full_name},</p>
          <p>Unfortunately, your expert account verification was not approved at this time.</p>
          <p>If you believe this was an error or would like to provide additional information, please contact our support team.</p>
          <p>
            <a href="https://expertgate.cc/support" 
               style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Contact Support
            </a>
          </p>
        </div>
      `;

    const emailResponse = await resend.emails.send({
      from: "ExpertGate <noreply@expertgate.cc>",
      to: [expert.email],
      subject,
      html,
    });

    console.log("Verification notification sent:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in send-expert-verification-notification:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
