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
    console.log("Processing interview reminders...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);
    const thirtyFiveMinutesFromNow = new Date(now.getTime() + 35 * 60 * 1000);

    // Get interviews scheduled for tomorrow (24h reminder window)
    const oneDayStart = new Date(oneDayFromNow.getTime() - 30 * 60 * 1000);
    const oneDayEnd = new Date(oneDayFromNow.getTime() + 30 * 60 * 1000);

    // Fetch interviews for 24h reminder
    const { data: dayReminderInterviews, error: dayError } = await supabase
      .from("interview_requests")
      .select(`
        *,
        expert:expert_id (id, full_name, email),
        researcher:researcher_id (id, full_name, email)
      `)
      .eq("status", "accepted")
      .gte("scheduled_date", oneDayStart.toISOString())
      .lte("scheduled_date", oneDayEnd.toISOString());

    if (dayError) {
      console.error("Error fetching day reminder interviews:", dayError);
    } else if (dayReminderInterviews && dayReminderInterviews.length > 0) {
      console.log(`Found ${dayReminderInterviews.length} interviews for 24h reminder`);
      
      for (const interview of dayReminderInterviews) {
        // Send to expert
        if (interview.expert?.email) {
          await resend.emails.send({
            from: "ExpertGate <reminders@expertgate.cc>",
            to: [interview.expert.email],
            subject: `Interview Reminder: Tomorrow with ${interview.researcher?.full_name}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #333;">Interview Reminder</h1>
                <p>Dear ${interview.expert.full_name},</p>
                <p>This is a reminder that you have an interview scheduled for <strong>tomorrow</strong>.</p>
                <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p><strong>Topic:</strong> ${interview.research_topic}</p>
                  <p><strong>With:</strong> ${interview.researcher?.full_name}</p>
                  <p><strong>Date:</strong> ${new Date(interview.scheduled_date).toLocaleString()}</p>
                  <p><strong>Duration:</strong> ${interview.duration_minutes} minutes</p>
                </div>
                <p>
                  <a href="https://expertgate.cc/expert-dashboard" 
                     style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    View Dashboard
                  </a>
                </p>
              </div>
            `,
          });
        }

        // Send to researcher
        if (interview.researcher?.email) {
          await resend.emails.send({
            from: "ExpertGate <reminders@expertgate.cc>",
            to: [interview.researcher.email],
            subject: `Interview Reminder: Tomorrow with ${interview.expert?.full_name}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #333;">Interview Reminder</h1>
                <p>Dear ${interview.researcher.full_name},</p>
                <p>This is a reminder that you have an interview scheduled for <strong>tomorrow</strong>.</p>
                <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p><strong>Topic:</strong> ${interview.research_topic}</p>
                  <p><strong>With:</strong> ${interview.expert?.full_name}</p>
                  <p><strong>Date:</strong> ${new Date(interview.scheduled_date).toLocaleString()}</p>
                  <p><strong>Duration:</strong> ${interview.duration_minutes} minutes</p>
                </div>
                <p>
                  <a href="https://expertgate.cc/interviews" 
                     style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    View Interviews
                  </a>
                </p>
              </div>
            `,
          });
        }
      }
    }

    // Fetch interviews for 30min reminder
    const { data: shortReminderInterviews, error: shortError } = await supabase
      .from("interview_requests")
      .select(`
        *,
        expert:expert_id (id, full_name, email),
        researcher:researcher_id (id, full_name, email)
      `)
      .eq("status", "accepted")
      .gte("scheduled_date", thirtyMinutesFromNow.toISOString())
      .lte("scheduled_date", thirtyFiveMinutesFromNow.toISOString());

    if (shortError) {
      console.error("Error fetching short reminder interviews:", shortError);
    } else if (shortReminderInterviews && shortReminderInterviews.length > 0) {
      console.log(`Found ${shortReminderInterviews.length} interviews for 30min reminder`);
      
      for (const interview of shortReminderInterviews) {
        // Send to expert
        if (interview.expert?.email) {
          await resend.emails.send({
            from: "ExpertGate <reminders@expertgate.cc>",
            to: [interview.expert.email],
            subject: `Interview Starting Soon: In 30 minutes with ${interview.researcher?.full_name}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #f59e0b;">Interview Starting Soon!</h1>
                <p>Dear ${interview.expert.full_name},</p>
                <p>Your interview is starting in <strong>30 minutes</strong>.</p>
                <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p><strong>Topic:</strong> ${interview.research_topic}</p>
                  <p><strong>With:</strong> ${interview.researcher?.full_name}</p>
                  <p><strong>Duration:</strong> ${interview.duration_minutes} minutes</p>
                </div>
                <p>Please make sure you're ready for the interview.</p>
              </div>
            `,
          });
        }

        // Send to researcher
        if (interview.researcher?.email) {
          await resend.emails.send({
            from: "ExpertGate <reminders@expertgate.cc>",
            to: [interview.researcher.email],
            subject: `Interview Starting Soon: In 30 minutes with ${interview.expert?.full_name}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #f59e0b;">Interview Starting Soon!</h1>
                <p>Dear ${interview.researcher.full_name},</p>
                <p>Your interview is starting in <strong>30 minutes</strong>.</p>
                <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p><strong>Topic:</strong> ${interview.research_topic}</p>
                  <p><strong>With:</strong> ${interview.expert?.full_name}</p>
                  <p><strong>Duration:</strong> ${interview.duration_minutes} minutes</p>
                </div>
                <p>Please make sure you're ready for the interview.</p>
              </div>
            `,
          });
        }
      }
    }

    console.log("Interview reminders processed successfully");

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in send-interview-reminders:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
