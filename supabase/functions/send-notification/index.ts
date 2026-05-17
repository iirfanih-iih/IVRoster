import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = 're_XexNfD3M_BSmv3uGNyMdVvotZNooj3CQ7';
const NOTIFY_EMAIL = 'iirfanih@gmail.com';
const FROM_EMAIL = 'IV Roster <onboarding@resend.dev>';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { subject, body, category } = await req.json();
    if (!subject || !body) throw new Error('Missing subject or body');

    // Send email via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [NOTIFY_EMAIL],
        subject: `[IV Roster] ${subject}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
            <div style="background:#0C2461;color:#fff;padding:16px 20px;border-radius:8px 8px 0 0;">
              <h2 style="margin:0;font-size:16px;">IV Roster Notification</h2>
            </div>
            <div style="background:#f8f9fa;padding:20px;border:1px solid #ddd;border-top:none;border-radius:0 0 8px 8px;">
              <p style="margin:0 0 8px;font-size:12px;color:#666;text-transform:uppercase;letter-spacing:1px;">${category || 'System'}</p>
              <p style="margin:0;font-size:14px;line-height:1.6;color:#333;">${body}</p>
              <hr style="margin:16px 0;border:none;border-top:1px solid #ddd;">
              <p style="margin:0;font-size:11px;color:#999;">This is an automated notification from IV Roster System.<br>Auckland Jamatkhana — Ismaili Volunteers</p>
            </div>
          </div>
        `
      })
    });

    const result = await res.json();
    if (res.status >= 400) throw new Error(result.message || 'Resend API error');

    return new Response(
      JSON.stringify({ success: true, id: result.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, error: e.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
