import { useCallback, useEffect, useMemo, useState } from 'react';

import * as authApi from '../api/auth';
import { setSessionLostHandler } from '../api/client';
import { AuthContext } from './auth-context';

/**
 * حالة المصادقة.
 *
 * status يبدأ بـ 'loading' عمدًا: بدونه سيرى المستخدم المسجّل زر
 * "تسجيل الدخول" يومض ثم يتحول إلى اسمه، فيظن أنه خرج من حسابه.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let active = true;

    // كوكي التجديد httpOnly، فلا سبيل لمعرفة وجود جلسة إلا بمحاولة استخدامها.
    authApi
      .restoreSession()
      .then((restored) => {
        if (!active) return;
        setUser(restored);
        setStatus(restored ? 'authenticated' : 'anonymous');
      })
      .catch(() => {
        if (!active) return;
        setUser(null);
        setStatus('anonymous');
      });

    return () => {
      active = false;
    };
  }, []);

  // إن سقطت الجلسة أثناء الاستخدام، تُصفّى الحالة فورًا.
  useEffect(() => {
    setSessionLostHandler(() => {
      setUser(null);
      setStatus('anonymous');
    });

    return () => setSessionLostHandler(null);
  }, []);

  const signIn = useCallback(async (credentials) => {
    const signed = await authApi.login(credentials);
    setUser(signed);
    setStatus('authenticated');
    return signed;
  }, []);

  const signUp = useCallback(async (details) => {
    const created = await authApi.register(details);
    setUser(created);
    setStatus('authenticated');
    return created;
  }, []);

  const signOut = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    setStatus('anonymous');
  }, []);

  const value = useMemo(
    () => ({
      user,
      status,
      isLoading: status === 'loading',
      isAuthenticated: status === 'authenticated',
      isAdmin: user?.role === 'admin',
      signIn,
      signUp,
      signOut,
    }),
    [user, status, signIn, signUp, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
