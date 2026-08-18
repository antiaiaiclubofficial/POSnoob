import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

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
