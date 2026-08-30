// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Utility function to verify LINE signature
async function verifySignature(signature: string, body: string, channelSecret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(channelSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
  
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(body)
  );
  
  // Convert ArrayBuffer to Base64
  const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));
  return signature === expectedSignature;
}

serve(async (req) => {
  // LINE Webhooks use POST
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const url = new URL(req.url);
    const storeId = url.searchParams.get('store_id');

    if (!storeId) {
      return new Response('Missing store_id query parameter', { status: 400 });
    }

    const signature = req.headers.get('x-line-signature');
    if (!signature) {
      return new Response('Missing x-line-signature', { status: 400 });
    }

    // Read raw body for signature verification
    const rawBody = await req.text();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch store credentials
    // Note: Assuming `line_channel_secret` is added to the stores table. 
    // If you only have liff_channel_secret, we'll try to use it, but typically it should be line_channel_secret.
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('line_channel_access_token, line_channel_secret, liff_channel_secret')
      .eq('id', storeId)
      .single();

    if (storeError || !store) {
      console.error('Store not found', storeError);
      return new Response('Store not found', { status: 404 });
    }

    const channelSecret = store.line_channel_secret || store.liff_channel_secret;
    const accessToken = store.line_channel_access_token;

    if (!channelSecret) {
      console.error('Channel Secret is missing for this store');
      return new Response('Channel Secret missing', { status: 500 });
    }

    // Verify signature
    const isValid = await verifySignature(signature, rawBody, channelSecret);
    if (!isValid) {
      console.error('Invalid LINE signature');
      return new Response('Invalid signature', { status: 401 });
    }

    // Parse the JSON payload
    const body = JSON.parse(rawBody);
    
    // Process events
    for (const event of body.events) {
      // 1. Check if event is a message from a user
      if (event.type === 'message' && event.source.type === 'user') {
        const userId = event.source.userId;
        const messageType = event.message.type; // 'text', 'image', 'sticker', etc.
        const messageText = messageType === 'text' ? event.message.text : '';
        const replyToken = event.replyToken;

        // 2. Insert into chat_messages table
        const { error: insertError } = await supabase
          .from('chat_messages')
          .insert({
            store_id: storeId,
            customer_line_uid: userId,
            message_type: messageType,
            message_text: messageText,
            direction: 'in'
          });

        if (insertError) {
          console.error('Error inserting message', insertError);
        }

        // 3. Auto-reply logic (if we have access token and reply token)
        if (accessToken && replyToken) {
          const replyText = "สวัสดีครับ ทางร้านได้รับข้อความแล้ว จะรีบตอบกลับโดยเร็วนะครับ";
          
          await fetch('https://api.line.me/v2/bot/message/reply', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
              replyToken: replyToken,
              messages: [{
                type: 'text',
                text: replyText
              }]
            })
          }).catch(err => console.error('Error sending reply', err));
        }
      }
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Error in webhook', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
})
