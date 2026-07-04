import { createClient } from '@supabase/supabase-js';
const supabase = createClient("https://wvrreqwvgrsvmrwuavna.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2cnJlcXd2Z3Jzdm1yd3Vhdm5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNzg2NTcsImV4cCI6MjA5NTk1NDY1N30.yFiDakXWBp4bzOKtjDHK2GuV9VeuWD4nTQ1H7NGLvyY");

async function check() {
  const { data, error } = await supabase.from('billing_documents').select('id, store_id, document_no, type, date, partner_id, customer_id, customer_name, customer_address, customer_tax_id, items, subtotal, vat_amount, total_amount, payment_method, status, created_by').limit(1);
  console.log("Error:", error);
}
check();
