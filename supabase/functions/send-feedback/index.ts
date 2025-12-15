import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface FeedbackRequest {
  feedback: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { feedback }: FeedbackRequest = await req.json();

    if (!feedback || !feedback.trim()) {
      return new Response(
        JSON.stringify({ error: "Feedback is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Sending feedback email...");

    const emailResponse = await resend.emails.send({
      from: "Feedback <feedback@expertgate.cc>",
      to: ["iowfoai@gmail.com"],
      subject: "New Feedback Received",
      html: `
        <h1>New Feedback Submission</h1>
        <p><strong>Submitted at:</strong> ${new Date().toLocaleString()}</p>
        <hr />
        <p>${feedback.replace(/\n/g, "<br />")}</p>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-feedback function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
