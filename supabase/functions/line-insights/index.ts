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
    const { storeId, userIdsToVerify } = await req.json()

    if (!storeId) {
      throw new Error("Missing storeId in request body");
    }

    // Initialize Supabase client with Service Role Key to bypass RLS and read settings
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

    // Get yesterday's date in yyyyMMdd format
    const date = new Date();
    date.setDate(date.getDate() - 1);
    const dateString = date.toISOString().split('T')[0].replace(/-/g, '');

    const followersResponse = await fetch(`https://api.line.me/v2/bot/insight/followers?date=${dateString}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
      },
    });

    const followersData = await followersResponse.json();

    if (!followersResponse.ok) {
      throw new Error(`LINE API Error (followers): ${JSON.stringify(followersData)}`);
    }

    // Fetch replies sent stats
    let repliesSent = 0;
    try {
      const replyResponse = await fetch(`https://api.line.me/v2/bot/message/delivery/reply?date=${dateString}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
        },
      });
      if (replyResponse.ok) {
        const replyData = await replyResponse.json();
        if (replyData.status === 'ready') {
            repliesSent = replyData.success || 0;
        }
      }
    } catch (e) {
      console.error("Error fetching reply stats:", e);
    }

    // Verify user connections
    const userStatusMap: Record<string, boolean> = {};
    
    if (userIdsToVerify && Array.isArray(userIdsToVerify) && userIdsToVerify.length > 0) {
      // Limit to 20 users to avoid too many requests at once
      const idsToCheck = userIdsToVerify.slice(0, 20);
      
      await Promise.all(idsToCheck.map(async (userId) => {
        try {
          const profileResponse = await fetch(`https://api.line.me/v2/bot/profile/${userId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
            },
          });
          
          if (profileResponse.ok) {
            userStatusMap[userId] = true;
          } else {
            userStatusMap[userId] = false;
          }
        } catch (e) {
          console.error(`Error verifying user ${userId}:`, e);
          userStatusMap[userId] = false;
        }
      }));
    }

    return new Response(
      JSON.stringify({
        ...followersData,
        repliesSent,
        userStatusMap
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
