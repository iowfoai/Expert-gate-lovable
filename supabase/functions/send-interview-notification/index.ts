import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: "new_request" | "request_accepted" | "request_declined";
  interviewRequestId: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, interviewRequestId }: NotificationRequest = await req.json();
    console.log(`Processing notification: ${type} for request ${interviewRequestId}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch interview request with researcher and expert details
    const { data: request, error: requestError } = await supabase
      .from("interview_requests")
      .select("*, researcher:profiles!interview_requests_researcher_id_fkey(email, full_name), expert:profiles!interview_requests_expert_id_fkey(email, full_name)")
      .eq("id", interviewRequestId)
      .single();

    if (requestError || !request) {
      console.error("Error fetching interview request:", requestError);
      throw new Error("Interview request not found");
    }

    console.log("Request data:", JSON.stringify(request));

    let recipientEmail: string;
    let recipientName: string;
    let subject: string;
    let htmlContent: string;

    if (type === "new_request") {
      // Notify expert about new request
      recipientEmail = request.expert?.email;
      recipientName = request.expert?.full_name || "Expert";
      const researcherName = request.researcher?.full_name || "A researcher";
      
      subject = "New Interview Request on ExpertConnect";
      htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1a1a1a; font-size: 24px;">New Interview Request</h1>
          <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
            Hello ${recipientName},
          </p>
          <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
            <strong>${researcherName}</strong> has sent you an interview request.
          </p>
          <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 8px 0;"><strong>Research Topic:</strong> ${request.research_topic}</p>
            <p style="margin: 0 0 8px 0;"><strong>Duration:</strong> ${request.duration_minutes} minutes</p>
            ${request.preferred_date ? `<p style="margin: 0;"><strong>Preferred Date:</strong> ${new Date(request.preferred_date).toLocaleDateString()}</p>` : ''}
          </div>
          <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
            Please log in to your dashboard to review and respond to this request.
          </p>
          <p style="color: #888; font-size: 14px; margin-top: 30px;">
            Best regards,<br>The ExpertConnect Team
          </p>
        </div>
      `;
    } else if (type === "request_accepted") {
      // Notify researcher that request was accepted
      recipientEmail = request.researcher?.email;
      recipientName = request.researcher?.full_name || "Researcher";
      const expertName = request.expert?.full_name || "The expert";
      
      subject = "Your Interview Request Has Been Accepted!";
      htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1a1a1a; font-size: 24px;">Great News! 🎉</h1>
          <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
            Hello ${recipientName},
          </p>
          <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
            <strong>${expertName}</strong> has accepted your interview request!
          </p>
          <div style="background: #e8f5e9; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 8px 0;"><strong>Research Topic:</strong> ${request.research_topic}</p>
            <p style="margin: 0;"><strong>Duration:</strong> ${request.duration_minutes} minutes</p>
          </div>
          <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
            You can now chat with the expert through the Connections page to coordinate your interview.
          </p>
          <p style="color: #888; font-size: 14px; margin-top: 30px;">
            Best regards,<br>The ExpertConnect Team
          </p>
        </div>
      `;
    } else if (type === "request_declined") {
      // Notify researcher that request was declined
      recipientEmail = request.researcher?.email;
      recipientName = request.researcher?.full_name || "Researcher";
      const expertName = request.expert?.full_name || "The expert";
      
      subject = "Update on Your Interview Request";
      htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1a1a1a; font-size: 24px;">Interview Request Update</h1>
          <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
            Hello ${recipientName},
          </p>
          <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
            Unfortunately, <strong>${expertName}</strong> was unable to accept your interview request at this time.
          </p>
          <div style="background: #fff3e0; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Research Topic:</strong> ${request.research_topic}</p>
          </div>
          <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
            Don't be discouraged! There are many other experts available. Browse the Experts Directory to find someone who can help with your research.
          </p>
          <p style="color: #888; font-size: 14px; margin-top: 30px;">
            Best regards,<br>The ExpertConnect Team
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
    console.error("Error in send-interview-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
