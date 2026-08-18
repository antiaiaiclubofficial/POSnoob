import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://wvrreqwvgrsvmrwuavna.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2cnJlcXd2Z3Jzdm1yd3Vhdm5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNzg2NTcsImV4cCI6MjA5NTk1NDY1N30.yFiDakXWBp4bzOKtjDHK2GuV9VeuWD4nTQ1H7NGLvyY";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function fixVoidedDocuments() {
  console.log("Fetching voided transactions...");
  const { data: voidedTx, error: txError } = await supabase
    .from('sales_transactions')
    .select('id, amount, created_at')
    .eq('status', 'voided');

  if (txError) {
    console.error("Error fetching transactions:", txError);
    return;
  }

  console.log(`Found ${voidedTx.length} voided transactions.`);

  for (const tx of voidedTx) {
    // Find billing document matching date & amount & Paid
    const txDatePrefix = tx.created_at.substring(0, 10);
    const { data: docs, error: docError } = await supabase
      .from('billing_documents')
      .select('id, date, status, remarks')
      .eq('total_amount', tx.amount)
      .eq('status', 'Paid')
      .eq('remarks', 'Auto-generated from POS')
      .like('date', `${txDatePrefix}%`);

    if (docError) {
      console.error(`Error fetching docs for tx ${tx.id}:`, docError);
      continue;
    }

    if (docs && docs.length > 0) {
      for (const doc of docs) {
        console.log(`Cancelling document ${doc.id} for voided tx ${tx.id}`);
        await supabase
          .from('billing_documents')
          .update({ status: 'Cancelled', reference_document_no: tx.id })
          .eq('id', doc.id);
      }
    }
  }
  console.log("Done.");
}

fixVoidedDocuments();
