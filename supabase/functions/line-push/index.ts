// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { storeId, customerLineUid, messageText } = await req.json()

    if (!storeId || !customerLineUid || !messageText) {
      throw new Error("Missing required fields (storeId, customerLineUid, messageText)");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the line_channel_access_token from the stores table
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('line_channel_access_token')
      .eq('id', storeId)
      .single();

    if (storeError || !store?.line_channel_access_token) {
      throw new Error("Could not find line_channel_access_token for this store");
    }

    const LINE_CHANNEL_ACCESS_TOKEN = store.line_channel_access_token;

    // Send the message using LINE Push API
    const pushResponse = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        to: customerLineUid,
        messages: [{
          type: 'text',
          text: messageText
        }]
      })
    });

    const pushData = await pushResponse.json();

    if (!pushResponse.ok) {
      throw new Error(`LINE API Error: ${JSON.stringify(pushData)}`);
    }

    // Insert the outgoing message into chat_messages
    const { error: insertError } = await supabase
      .from('chat_messages')
      .insert({
        store_id: storeId,
        customer_line_uid: customerLineUid,
        message_type: 'text',
        message_text: messageText,
        direction: 'out'
      });

    if (insertError) {
      console.error('Error inserting message into chat_messages', insertError);
      // We don't throw here because the message was already sent successfully to LINE
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error("line-push error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
