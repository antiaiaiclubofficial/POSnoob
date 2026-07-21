-- Rollback for Migration: 20260721182000_document_sequences.sql

DROP FUNCTION IF EXISTS public.fn_generate_document_no(UUID, TEXT, TEXT);
DROP TABLE IF EXISTS public.document_counters;
