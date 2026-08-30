// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { storeId } = await req.json()

    if (!storeId) {
      throw new Error("Missing required field: storeId");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the line_channel_access_token, line_bot_user_id, and line_oa_manager_url
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('line_channel_access_token, line_bot_user_id, line_oa_manager_url')
      .eq('id', storeId)
      .single();

    if (storeError) {
      throw new Error("Could not find store");
    }
    
    // If the request explicitly asks to refresh, or if we are missing the bot ID, we fetch from LINE
    const forceRefresh = req.url.includes('refresh=true');
    
    if (!forceRefresh && store?.line_bot_user_id && store?.line_oa_manager_url) {
        return new Response(
          JSON.stringify({ 
            botUserId: store.line_bot_user_id, 
            lineOaManagerUrl: store.line_oa_manager_url 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
    }

    if (!store?.line_channel_access_token) {
      throw new Error("No line_channel_access_token found for this store");
    }

    const LINE_CHANNEL_ACCESS_TOKEN = store.line_channel_access_token;

    // Fetch bot info from LINE API
    const botInfoResponse = await fetch('https://api.line.me/v2/bot/info', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
      }
    });

    const botData = await botInfoResponse.json();

    if (!botInfoResponse.ok) {
      throw new Error(`LINE API Error: ${JSON.stringify(botData)}`);
    }

    const botUserId = botData.userId;
    const generatedUrl = botUserId ? `https://chat.line.biz/${botUserId}` : null;

    if (botUserId || generatedUrl) {
        // Save to DB for caching
        await supabase
          .from('stores')
          .update({ 
            line_bot_user_id: botUserId || store.line_bot_user_id,
            line_oa_manager_url: generatedUrl || store.line_oa_manager_url
          })
          .eq('id', storeId);
    }

    return new Response(
      JSON.stringify({ 
        botUserId: botUserId || store?.line_bot_user_id,
        lineOaManagerUrl: generatedUrl || store?.line_oa_manager_url
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error: any) {
    console.error("line-bot-info error:", error);
    return new Response(
      JSON.stringify({ error: error.message || String(error) }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
