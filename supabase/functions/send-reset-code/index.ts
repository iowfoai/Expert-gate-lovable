import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendResetCodeRequest {
  email: string;
}

// Generate a 6-digit verification code
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: SendResetCodeRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check if user exists
    const { data: userData, error: userError } = await supabaseClient
      .from("profiles")
      .select("email")
      .eq("email", email)
      .single();

    if (userError || !userData) {
      // Don't reveal if user exists or not for security
      console.log("User not found:", email);
      return new Response(
        JSON.stringify({ message: "If an account exists, a reset code has been sent" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate verification code
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store code in database
    const { error: insertError } = await supabaseClient
      .from("password_reset_codes")
      .insert({
        email,
        code,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error("Error storing reset code:", insertError);
      throw new Error("Failed to generate reset code");
    }

    // Send email with code
    const emailResponse = await resend.emails.send({
      from: "ExpertGate <onboarding@resend.dev>",
      to: [email],
      subject: "Password Reset Code - ExpertGate",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Password Reset Request</h1>
          <p>You requested to reset your password for your ExpertGate account.</p>
          <p>Your verification code is:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            ${code}
          </div>
          <p>This code will expire in 15 minutes.</p>
          <p>If you didn't request this password reset, please ignore this email.</p>
          <p>Best regards,<br>The ExpertGate Team</p>
        </div>
      `,
    });

    console.log("Reset code email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ message: "If an account exists, a reset code has been sent" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-reset-code function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
