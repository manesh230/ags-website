// =====================================================
//  PASTE YOUR SUPABASE CREDENTIALS HERE
//  (From Supabase Dashboard → Project Settings → API)
// =====================================================
const SUPABASE_URL  = 'https://ljgjhsuqephufwbvvvwf.supabase.co';
const SUPABASE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqZ2poc3VxZXBodWZ3YnZ2dndmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNjc4NTYsImV4cCI6MjA4ODY0Mzg1Nn0.erwPgl7DD6I4_iHupUJYFdxy5g7yAguV_iuXd6ORU3M';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
