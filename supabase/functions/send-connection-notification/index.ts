import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: "connection_request" | "connection_accepted";
  connectionId: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, connectionId }: NotificationRequest = await req.json();
    console.log(`Processing connection notification: ${type} for connection ${connectionId}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch connection with requester and recipient details
    const { data: connection, error: connectionError } = await supabase
      .from("expert_connections")
      .select("*")
      .eq("id", connectionId)
      .single();

    if (connectionError || !connection) {
      console.error("Error fetching connection:", connectionError);
      throw new Error("Connection not found");
    }

    // Fetch requester profile
    const { data: requester } = await supabase
      .from("profiles")
      .select("email, full_name, user_type, institution")
      .eq("id", connection.requester_id)
      .single();

    // Fetch recipient profile
    const { data: recipient } = await supabase
      .from("profiles")
      .select("email, full_name, user_type, institution")
      .eq("id", connection.recipient_id)
      .single();

    if (!requester || !recipient) {
      throw new Error("Could not fetch user profiles");
    }

    console.log("Connection data:", JSON.stringify({ connection, requester, recipient }));

    let recipientEmail: string;
    let recipientName: string;
    let subject: string;
    let htmlContent: string;

    const requesterTypeLabel = requester.user_type === 'expert' ? 'Expert' : 'Researcher';
    const recipientTypeLabel = recipient.user_type === 'expert' ? 'Expert' : 'Researcher';

    if (type === "connection_request") {
      // Notify recipient about new connection request
      recipientEmail = recipient.email;
      recipientName = recipient.full_name || "User";
      const senderName = requester.full_name || "A user";
      const senderInstitution = requester.institution || "Unknown institution";
      
      subject = `New Connection Request on ExpertGate`;
      htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1a1a1a; font-size: 24px;">New Connection Request</h1>
          <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
            Hello ${recipientName},
          </p>
          <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
            <strong>${senderName}</strong> (${requesterTypeLabel}) would like to connect with you.
          </p>
          <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 8px 0;"><strong>Name:</strong> ${senderName}</p>
            <p style="margin: 0 0 8px 0;"><strong>Role:</strong> ${requesterTypeLabel}</p>
            <p style="margin: 0;"><strong>Institution:</strong> ${senderInstitution}</p>
          </div>
          <h3 style="color: #1a1a1a; font-size: 18px;">How to respond:</h3>
          <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
            To accept or decline this request, please log in to ExpertGate and go to the <strong>Chats</strong> page. 
            You'll find all pending connection requests there where you can review and respond to them.
          </p>
          <p style="color: #888; font-size: 14px; margin-top: 30px;">
            Best regards,<br>The ExpertGate Team
          </p>
        </div>
      `;
    } else if (type === "connection_accepted") {
      // Notify requester that their connection request was accepted
      recipientEmail = requester.email;
      recipientName = requester.full_name || "User";
      const accepterName = recipient.full_name || "A user";
      const accepterInstitution = recipient.institution || "Unknown institution";
      
      subject = "Your Connection Request Has Been Accepted!";
      htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1a1a1a; font-size: 24px;">Great News! 🎉</h1>
          <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
            Hello ${recipientName},
          </p>
          <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
            <strong>${accepterName}</strong> (${recipientTypeLabel}) has accepted your connection request!
          </p>
          <div style="background: #e8f5e9; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 8px 0;"><strong>Name:</strong> ${accepterName}</p>
            <p style="margin: 0 0 8px 0;"><strong>Role:</strong> ${recipientTypeLabel}</p>
            <p style="margin: 0;"><strong>Institution:</strong> ${accepterInstitution}</p>
          </div>
          <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
            You can now chat with ${accepterName} through the <strong>Chats</strong> page on ExpertGate.
          </p>
          <p style="color: #888; font-size: 14px; margin-top: 30px;">
            Best regards,<br>The ExpertGate Team
          </p>
        </div>
      `;
    } else {
      throw new Error("Invalid notification type");
    }

    if (!recipientEmail) {
      console.error("No recipient email found");
      throw new Error("Recipient email not found");
    }

    console.log(`Sending email to ${recipientEmail}`);

    const emailResponse = await resend.emails.send({
      from: "ExpertGate <notifications@expertgate.cc>",
      to: [recipientEmail],
      subject,
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-connection-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
