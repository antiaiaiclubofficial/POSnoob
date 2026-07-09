import { createClient } from '@supabase/supabase-js';
const SUPABASE_URL = "https://wvrreqwvgrsvmrwuavna.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2cnJlcXd2Z3Jzdm1yd3Vhdm5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNzg2NTcsImV4cCI6MjA5NTk1NDY1N30.yFiDakXWBp4bzOKtjDHK2GuV9VeuWD4nTQ1H7NGLvyY";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function test() {
  const { data, error } = await supabase.from('customers').select(`
    id,
    display_name,
    pets (
      id,
      name,
      created_at,
      pet_weight_history (
        date,
        weight,
        created_at
      )
    )
  `).limit(20);
  
  if (error) {
    console.error("Error:", error);
    return;
  }
  
  const targetPet = data.flatMap(c => c.pets).find(p => p.name === 'เจิด');
  console.log("Target Pet:", JSON.stringify(targetPet, null, 2));
}
test();
