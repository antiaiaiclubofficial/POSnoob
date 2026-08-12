import { supabase } from './src/integrations/supabase/client';

async function test() {
  const { data, error } = await supabase.from('package_templates').insert([{
    name: 'test',
    store_id: 'b0f3c613-f742-4c86-951a-eaa65c8b1667',
    paid_slots: 5,
    free_slots: 1,
    price: 2500,
    bonus_type: 'free_service',
    bonus_count: 1
  }]).select().single();
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Success:', data);
  }
}

test();
