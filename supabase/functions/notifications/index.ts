import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface SMSRequest {
  provider: 'twilio' | 'textlocal' | 'msg91' | 'textbee'
  credentials: any
  mobile: string
  message: string
}

interface WhatsAppRequest {
  provider: 'twilio' | 'business' | 'ultramsg' | 'callmebot'
  credentials: any
  mobile: string
  message: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', {
      headers: corsHeaders,
      status: 405,
    })
  }

  try {
    const url = new URL(req.url)
    const action = url.pathname.split('/').pop()

    switch (action) {
      case 'sms':
        const smsData: SMSRequest = await req.json()
        const smsResult = await sendSMS(smsData)
        
        return new Response(JSON.stringify(smsResult), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      case 'whatsapp':
        const whatsappData: WhatsAppRequest = await req.json()
        const whatsappResult = await sendWhatsApp(whatsappData)
        
        return new Response(JSON.stringify(whatsappResult), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      default:
        throw new Error('Invalid action. Supported actions: sms, whatsapp')
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

async function sendSMS(data: SMSRequest) {
  const { provider, credentials, mobile, message } = data

  switch (provider) {
    case 'twilio':
      return await sendViaTwilio(mobile, message, credentials)
    case 'textlocal':
      return await sendViaTextLocal(mobile, message, credentials)
    case 'msg91':
      return await sendViaMSG91(mobile, message, credentials)
    case 'textbee':
      return await sendViaTextBee(mobile, message, credentials)
    default:
      throw new Error(`Unknown SMS provider: ${provider}`)
  }
}

async function sendWhatsApp(data: WhatsAppRequest) {
  const { provider, credentials, mobile, message } = data

  switch (provider) {
    case 'twilio':
      return await sendWhatsAppViaTwilio(mobile, message, credentials)
    case 'business':
      return await sendWhatsAppViaBusinessAPI(mobile, message, credentials)
    case 'ultramsg':
      return await sendWhatsAppViaUltraMsg(mobile, message, credentials)
    case 'callmebot':
      return await sendWhatsAppViaCallMeBot(mobile, message, credentials)
    default:
      throw new Error(`Unknown WhatsApp provider: ${provider}`)
  }
}

// SMS Provider Functions
async function sendViaTwilio(mobile: string, message: string, credentials: any) {
  const { accountSid, authToken, phoneNumber } = credentials

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      From: phoneNumber,
      To: `+91${mobile}`,
      Body: message
    })
  })

  if (!response.ok) {
    throw new Error(`Twilio API error: ${response.status}`)
  }

  return { success: true, provider: 'twilio' }
}

async function sendViaTextLocal(mobile: string, message: string, credentials: any) {
  const { apiKey, sender } = credentials

  const response = await fetch('https://api.textlocal.in/send/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      apikey: apiKey,
      numbers: mobile,
      message: message,
      sender: sender || 'SCHOOL'
    })
  })

  const result = await response.json()
  if (result.status !== 'success') {
    throw new Error(`TextLocal error: ${result.errors?.[0]?.message || 'Unknown error'}`)
  }

  return { success: true, provider: 'textlocal' }
}

async function sendViaMSG91(mobile: string, message: string, credentials: any) {
  const { apiKey, senderId, route } = credentials

  const response = await fetch(`https://api.msg91.com/api/sendhttp.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      authkey: apiKey,
      mobiles: mobile,
      message: message,
      sender: senderId || 'SCHOOL',
      route: route || '4'
    })
  })

  const result = await response.text()
  if (!result.includes('success')) {
    throw new Error(`MSG91 error: ${result}`)
  }

  return { success: true, provider: 'msg91' }
}

async function sendViaTextBee(mobile: string, message: string, credentials: any) {
  const { apiKey, deviceId } = credentials

  const response = await fetch('https://api.textbee.dev/api/v1/gateway/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({
      device: deviceId,
      phone: `+91${mobile}`,
      message: message,
    })
  })

  const result = await response.json()
  if (!response.ok || !result.success) {
    throw new Error(`TextBee error: ${result.message || result.error || 'Unknown error'}`)
  }

  return { success: true, provider: 'textbee' }
}

// WhatsApp Provider Functions
async function sendWhatsAppViaTwilio(mobile: string, message: string, credentials: any) {
  const { accountSid, authToken, phoneNumber } = credentials

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      From: `whatsapp:${phoneNumber}`,
      To: `whatsapp:+91${mobile}`,
      Body: message
    })
  })

  if (!response.ok) {
    throw new Error(`Twilio WhatsApp API error: ${response.status}`)
  }

  return { success: true, provider: 'twilio' }
}

async function sendWhatsAppViaBusinessAPI(mobile: string, message: string, credentials: any) {
  const { accessToken, phoneNumberId } = credentials

  const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: `91${mobile}`,
      type: 'text',
      text: {
        body: message
      }
    })
  })

  if (!response.ok) {
    throw new Error(`WhatsApp Business API error: ${response.status}`)
  }

  return { success: true, provider: 'business' }
}

async function sendWhatsAppViaUltraMsg(mobile: string, message: string, credentials: any) {
  const { token, instanceId } = credentials

  const response = await fetch(`https://api.ultramsg.com/${instanceId}/messages/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      token: token,
      to: `91${mobile}`,
      body: message
    })
  })

  const result = await response.json()
  if (!response.ok || result.sent !== true) {
    throw new Error(`UltraMsg error: ${result.error || 'Unknown error'}`)
  }

  return { success: true, provider: 'ultramsg' }
}

async function sendWhatsAppViaCallMeBot(mobile: string, message: string, credentials: any) {
  const { apiKey } = credentials

  const url = `https://api.callmebot.com/whatsapp.php?phone=91${mobile}&text=${encodeURIComponent(message)}&apikey=${apiKey}`
  
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`CallMeBot error: ${response.status}`)
  }

  return { success: true, provider: 'callmebot' }
}