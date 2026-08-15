import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.from('customers').select(`
    id,
    pets (
      id,
      pet_health_logs (
        id,
        type,
        description
      )
    )
  `).limit(5);
  console.log(JSON.stringify(data, null, 2));
  if (error) console.error(error);
}
test();
