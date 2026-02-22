import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  try {
    const payload = await req.json()
    const { record } = payload
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

    if (record && record.current_stock < record.minimum_threshold) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'Inventory Bot <onboarding@resend.dev>',
          to: ['kpratap1raju@gmail.com'],
          subject: `🚨 ACTION REQUIRED: Low Stock - ${record.name}`,
          html: `
            <div style="font-family: sans-serif; border: 1px solid #e5e7eb; border-radius: 12px; max-width: 500px; overflow: hidden;">
              <div style="background-color: #ef4444; color: white; padding: 16px; text-align: center;">
                <h1 style="margin: 0; font-size: 20px;">Inventory Alert</h1>
              </div>
              <div style="padding: 24px; color: #374151;">
                <p style="margin-top: 0;">The following item has dropped below its safe threshold:</p>
                
                <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; margin: 20px 0;">
                  <h2 style="margin: 0; color: #b91c1c; font-size: 24px;">${record.name}</h2>
                  <p style="margin: 4px 0 0 0; font-weight: bold; font-size: 16px;">
                    Current Stock: <span style="color: #ef4444;">${record.current_stock} units</span>
                  </p>
                </div>

                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Minimum Required:</td>
                    <td style="padding: 8px 0; font-weight: bold; text-align: right;">${record.minimum_threshold} units</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Deficit:</td>
                    <td style="padding: 8px 0; font-weight: bold; text-align: right; color: #ef4444;">-${record.minimum_threshold - record.current_stock} units</td>
                  </tr>
                </table>

                <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-bottom: 0;">
                  Automated alert from Community Food Bank Management System
                </p>
              </div>
            </div>
          `,
        }),
      })

      const resData = await res.json()
      return new Response(JSON.stringify(resData), { status: 200 })
    }

    return new Response(JSON.stringify({ message: "Stock safe" }), { status: 200 })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})