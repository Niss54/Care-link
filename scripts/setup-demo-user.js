import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://anugsuampvoajbpvacwi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFudWdzdWFtcHZvYWpicHZhY3dpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxOTkxMDIsImV4cCI6MjEwMTc3NTEwMn0.sKKoWv37-_pQOEYBhN-bSj2dziO47biy0gL2kUpcqKw';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Signing up user...');
  const { data, error } = await supabase.auth.signUp({
    email: 'admin@carelink.com',
    password: 'carelink-demo',
  });
  if (error) {
    console.error('Error signing up:', error.message);
  } else {
    console.log('User signed up successfully:', data.user?.id);
  }
}

main();
