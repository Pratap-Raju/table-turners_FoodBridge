import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  try {
    const payload = await req.json()
    const { record } = payload
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Community Food Bank <onboarding@resend.dev>',
        to: [record.donor_email],
        subject: 'Confirmed: Your Donation Pledge',
        html: `
          <div style="font-family: sans-serif; color: #1f2937; max-width: 600px; margin: auto; border: 1px solid #f3f4f6; border-radius: 16px; padding: 32px;">
            <h1 style="color: #1e3a8a; margin-top: 0;">Thank you, ${record.donor_name}!</h1>
            <p style="font-size: 16px; line-height: 1.5;">We've successfully recorded your pledge. Your generosity helps provide meals to families in our community.</p>
            
            <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin: 32px 0;">
              <h3 style="margin-top: 0; color: #f26522; text-transform: uppercase; font-size: 12px; letter-spacing: 0.05em;">Pledge Details</h3>
              
              <div style="margin-bottom: 12px;">
                <span style="color: #64748b; font-size: 14px;">Estimated Arrival</span><br/>
                <strong style="font-size: 18px;">${record.expected_arrival}</strong>
              </div>
              
              <div>
                <span style="color: #64748b; font-size: 14px;">Items Pledged</span><br/>
                <strong style="font-size: 18px;">${record.quantity_pledged} Units</strong>
              </div>
            </div>

            <p style="font-size: 14px; color: #4b5563;">
              <strong>Drop-off Location:</strong> 123 Community Way, Edmonton, AB<br/>
              <strong>Hours:</strong> Mon-Fri, 9am - 4pm
            </p>

            <div style="margin-top: 32px; border-top: 1px solid #f3f4f6; pt-24px;">
              <p style="font-size: 12px; color: #9ca3af;">
                If you need to change your arrival time, please contact us at support@foodbank.org
              </p>
            </div>
          </div>
        `,
      }),
    })

    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})