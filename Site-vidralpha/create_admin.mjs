import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://nyayegnnjwbdtmvvkhau.supabase.co'
const SUPABASE_KEY = 'sb_publishable_QtGRNKXvt5mOGPOSDxjS7g_at1OYRlI'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function createAdmin() {
  console.log('Criando usuário...');
  const { data, error } = await supabase.auth.signUp({
    email: 'Vidralphaesquadrias@gmail.com',
    password: '@Vidralpha',
    options: {
      data: {
        full_name: 'Admin Vidralpha',
        role: 'admin'
      }
    }
  })

  if (error) {
    console.error('Erro ao criar usuário:', error.message)
    return
  }

  console.log('Usuário criado com sucesso!')
  console.log('User ID:', data.user.id)
  
  // Como estamos usando a API anon, o usuário pode estar logado agora, ou aguardando confirmação.
  // Se houver uma tabela profiles e trigger on auth.users, o profile deve ter sido criado.
  // Em seguida faremos log in para verificar.
}

createAdmin()
