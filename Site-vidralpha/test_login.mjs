import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://nyayegnnjwbdtmvvkhau.supabase.co'
const SUPABASE_KEY = 'sb_publishable_QtGRNKXvt5mOGPOSDxjS7g_at1OYRlI'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function testSignIn() {
  console.log('Testando login...');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'Vidralphaesquadrias@gmail.com',
    password: '@Vidralpha'
  })

  if (error) {
    console.error('Falha no login com a senha definida:', error.message)
    return
  }
  console.log('Login funcionou! A senha foi alterada/definida.')
}

testSignIn()
