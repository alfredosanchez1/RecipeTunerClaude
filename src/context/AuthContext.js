import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase/client';
import { ensureUserProfile } from '../services/supabase/auth';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  console.log('🚀 AUTH PROVIDER - Inicializando AuthProvider...');
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔐 AUTH CONTEXT - Inicializando autenticación...');
    console.log('🔐 AUTH CONTEXT - [TEST] Este mensaje debería aparecer siempre');

    // Obtener sesión inicial
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('❌ AUTH CONTEXT - Error obteniendo sesión:', error);
        } else {
          console.log('🔐 AUTH CONTEXT - Sesión inicial:', session ? 'Autenticado' : 'No autenticado');
          setSession(session);
          setUser(session?.user ?? null);

          // Si hay sesión inicial, asegurar que el perfil existe
          if (session?.user) {
            try {
              console.log('🔧 AUTH CONTEXT - Asegurando perfil de usuario para sesión inicial...');
              await ensureUserProfile(session.user);
              console.log('✅ AUTH CONTEXT - Perfil de usuario verificado/creado');
            } catch (error) {
              console.error('❌ AUTH CONTEXT - Error verificando perfil:', error);
              console.error('⚠️ AUTH CONTEXT - Continuando con la sesión de todos modos...');
              // No bloquear el login si hay problemas con el perfil
            }
          }
        }
      } catch (error) {
        console.error('❌ AUTH CONTEXT - Error inesperado obteniendo sesión:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 AUTH CONTEXT - Cambio de estado de autenticación:', event);

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (event === 'SIGNED_IN') {
        console.log('✅ AUTH CONTEXT - Usuario autenticado:', session.user.email);
        // Asegurar que el perfil existe
        try {
          console.log('🔧 AUTH CONTEXT - Asegurando perfil de usuario para SIGNED_IN...');
          await ensureUserProfile(session.user);
          console.log('✅ AUTH CONTEXT - Perfil de usuario verificado/creado en SIGNED_IN');
        } catch (error) {
          console.error('❌ AUTH CONTEXT - Error verificando perfil en SIGNED_IN:', error);
          console.error('⚠️ AUTH CONTEXT - Continuando con el login de todos modos...');
          // No lanzar el error - permitir que el login continúe
          // El perfil se puede crear más tarde si es necesario
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('👋 AUTH CONTEXT - Usuario desautenticado');
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      console.log('👋 AUTH CONTEXT - Cerrando sesión...');

      // Forzar limpieza local primero
      setSession(null);
      setUser(null);
      console.log('🧹 AUTH CONTEXT - Estados locales limpiados');

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('❌ AUTH CONTEXT - Error cerrando sesión:', error);
        throw error;
      }

      console.log('✅ AUTH CONTEXT - Sesión cerrada correctamente');
    } catch (error) {
      console.error('❌ AUTH CONTEXT - Error inesperado cerrando sesión:', error);
      // Aunque haya error, mantener estados locales limpiados
      setSession(null);
      setUser(null);
      throw error;
    }
  };

  const value = {
    user,
    session,
    loading,
    signOut,
    // Simplificado: solo verificar que hay sesión activa
    // El email_confirmed_at debería existir siempre en usuarios confirmados
    isAuthenticated: !!session && !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};