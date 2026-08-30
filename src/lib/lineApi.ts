import { supabase } from '@/integrations/supabase/client';

export interface LineFollowersData {
  status: string;
  followers: number;
  targetedReaches: number;
  blocks: number;
  repliesSent?: number;
  userStatusMap?: Record<string, boolean>;
}

export const fetchLineFollowers = async (storeId: string, userIdsToVerify?: string[]): Promise<LineFollowersData | null> => {
  try {
    const { data, error } = await supabase.functions.invoke('line-insights', {
      method: 'POST',
      body: { storeId, userIdsToVerify },
    });

    if (error) throw error;
    
    return data as LineFollowersData;
  } catch (error) {
    console.error('Error fetching LINE followers:', error);
    return null;
  }
};

export const sendLineMessage = async (storeId: string, customerLineUid: string, messageText: string): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const { data, error } = await supabase.functions.invoke('line-push', {
      body: { storeId, customerLineUid, messageText },
      headers: {
        Authorization: `Bearer ${session?.access_token}`
      }
    });

    if (error) {
      console.error('Error sending line message via edge function:', error);
      return false;
    }

    return data?.success || false;
  } catch (err) {
    console.error('Error invoking line-push function:', err);
    return false;
  }
};

export const fetchLineBotInfo = async (storeId: string, refresh: boolean = false): Promise<{ botUserId: string | null, lineOaManagerUrl: string | null }> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const { data, error } = await supabase.functions.invoke(`line-bot-info${refresh ? '?refresh=true' : ''}`, {
      body: { storeId },
      headers: {
        Authorization: `Bearer ${session?.access_token}`
      }
    });

    if (error) {
      console.error('Error fetching line bot info via edge function:', error);
      return { botUserId: null, lineOaManagerUrl: null };
    }

    return { 
      botUserId: data?.botUserId || null,
      lineOaManagerUrl: data?.lineOaManagerUrl || null
    };
  } catch (err) {
    console.error('Error invoking line-bot-info function:', err);
    return { botUserId: null, lineOaManagerUrl: null };
  }
};

export const getLineBotUserId = async (storeId: string): Promise<string | null> => {
  const info = await fetchLineBotInfo(storeId);
  return info.botUserId;
};
