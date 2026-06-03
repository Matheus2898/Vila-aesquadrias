import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../utils/supabaseClient'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (!error) {
        setProfile(data)
      }
    } catch (err) {
      console.error("[Auth] Erro ao buscar perfil:", err);
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Check active sessions and sets the user
    const getSession = async () => {
      console.log("[Auth] Iniciando getSession...");
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error;

        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setLoading(false)
        }
      } catch (err) {
        console.error("[Auth] Erro no getSession:", err);
        setLoading(false);
      }
    }

    getSession()

    // Safety timeout: se não carregar em 6 segundos, libera a tela
    const timeout = setTimeout(() => {
      setLoading(current => {
        if (current) {
          console.warn("[Auth] Timeout de carregamento atingido. Liberando tela.");
          return false;
        }
        return current;
      });
    }, 6000);

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut: () => supabase.auth.signOut() }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)
