import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
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
    const { expertId } = await req.json();
    console.log(`Processing expert signup notification for ${expertId}`);

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

    const emailResponse = await resend.emails.send({
      from: "ExpertGate <noreply@expertgate.cc>",
      to: [ADMIN_EMAIL],
      subject: `New Expert Registration: ${expert.full_name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">New Expert Registration</h1>
          <p>A new expert has registered and is awaiting verification:</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Name:</strong> ${expert.full_name}</p>
            <p><strong>Email:</strong> ${expert.email}</p>
            <p><strong>Institution:</strong> ${expert.institution || "Not specified"}</p>
            <p><strong>Field of Expertise:</strong> ${expert.field_of_expertise?.join(", ") || "Not specified"}</p>
            <p><strong>Years of Experience:</strong> ${expert.years_of_experience || "Not specified"}</p>
            <p><strong>Specific Experience:</strong> ${expert.specific_experience || "Not provided"}</p>
          </div>
          <p>
            <a href="https://expertgate.cc/admin-panel" 
               style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Review in Admin Panel
            </a>
          </p>
        </div>
      `,
    });

    console.log("Expert signup notification sent:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in send-expert-signup-notification:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
