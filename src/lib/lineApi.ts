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
