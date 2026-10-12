import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

import { fetchMe, login as loginRequest, refreshAccessToken } from "../api/auth";
import { setAccessToken, setRefreshHandler } from "../api/client";
import { clearMessageIndex } from "../lib/messageStore";
import {
  cacheKeys,
  clearOfflineCache,
  isNetworkError,
  readCache,
  writeCache,
} from "../lib/offlineCache";
import {
  disableBiometric,
  enableBiometric,
  getMeta,
  isPinSet,
  rotateStoredRefresh,
  setupPin,
  unlockWithPin,
  wipeLock,
} from "../lib/secureLock";
import { registerForPushNotifications } from "../notifications";

const AuthContext = createContext(null);

function registerPush() {
  registerForPushNotifications().catch(() => {});
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  // "locked": PIN qurulub, kilid ekranı göstərilməlidir.
  const [locked, setLocked] = useState(false);
  // "needsPinSetup": indicə parolla giriş oldu, PIN hələ qurulmayıb.
  const [needsPinSetup, setNeedsPinSetup] = useState(false);

  const refreshRef = useRef(null); // yaddaşdakı cari refresh token
  const pinRef = useRef(null); // rotasiya üçün cari PIN (yalnız yaddaşda, sessiya boyu)

  useEffect(() => {
    restoreSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 401 → refresh token ilə yeni access almağa cəhd. Server tokeni rədd
  // edərsə → kilidlə. İnternet yoxdursa kilidləmə — oflayn rejim davam edir.
  useEffect(() => {
    setRefreshHandler(async () => {
      if (!refreshRef.current) return null;
      try {
        const { data } = await refreshAccessToken(refreshRef.current);
        setAccessToken(data.access);
        return data.access;
      } catch (err) {
        if (!isNetworkError(err)) setLocked(true);
        return null;
      }
    });
  }, []);

  function rememberUser(me) {
    setUser(me);
    writeCache(cacheKeys.me, me);
  }

  async function restoreSession() {
    try {
      if (await isPinSet()) {
        // Sessiya var (şifrəli), amma kilidlidir — PIN ekranı açılacaq.
        setLocked(true);
      }
    } finally {
      setIsLoading(false);
    }
  }

  // 1) Parolla giriş — refresh tokeni yaddaşda saxlayır, PIN qurmağı gözləyir.
  async function login(username, password) {
    const { data } = await loginRequest({ username, password });
    setAccessToken(data.access);
    refreshRef.current = data.refresh;
    const me = await fetchMe();
    rememberUser(me.data);
    setNeedsPinSetup(true);
  }

  // 2) PIN qurma axınının sonu.
  async function completePinSetup(pin, wantBiometric) {
    await setupPin(pin, refreshRef.current);
    if (wantBiometric) await enableBiometric(refreshRef.current);
    pinRef.current = pin;
    setNeedsPinSetup(false);
    setLocked(false);
    registerPush();
  }

  // 3) Kilid açma — PIN/biometrika ekranından gələn refresh token ilə.
  // İnternet yoxdursa keşdəki profil ilə oflayn açılır; access token növbəti
  // sorğuda (401 → refresh) avtomatik alınır.
  async function unlock(refreshToken, pin) {
    refreshRef.current = refreshToken;
    if (pin) pinRef.current = pin;
    let online = true;
    try {
      const { data } = await refreshAccessToken(refreshToken);
      setAccessToken(data.access);
    } catch (err) {
      if (!isNetworkError(err)) throw err;
      online = false;
    }
    let me = user || (await readCache(cacheKeys.me));
    if (online) {
      try {
        me = (await fetchMe()).data;
      } catch (err) {
        if (!me || !isNetworkError(err)) throw err;
      }
    }
    if (!me) throw new Error("offline-no-profile");
    rememberUser(me);
    setLocked(false);
    if (online) registerPush();
  }

  // Profil ekranı açılanda təzələnir (məs. admin adı dəyişibsə).
  const refreshUser = useCallback(async () => {
    try {
      const { data } = await fetchMe();
      setUser(data);
      writeCache(cacheKeys.me, data);
    } catch {
      /* offline / token yoxdur — köhnə məlumat qalsın */
    }
  }, []);

  // App arxa plandan qayıdıб 60s+ keçibsə çağırılır.
  const lockNow = useCallback(() => {
    setAccessToken(null);
    setLocked(true);
  }, []);

  async function logout() {
    await wipeLock();
    await clearOfflineCache();
    await clearMessageIndex();
    setAccessToken(null);
    refreshRef.current = null;
    pinRef.current = null;
    setUser(null);
    setLocked(false);
    setNeedsPinSetup(false);
  }

  // Refresh token rotasiya olunanda saxlanılan (şifrəli) nüsxəni yenilə.
  async function persistRotatedRefresh(newRefresh) {
    refreshRef.current = newRefresh;
    if (pinRef.current) await rotateStoredRefresh(pinRef.current, newRefresh);
  }

  // Parametrlər → Təhlükəsizlik: PIN-i dəyiş (cari PIN yoxlanılır).
  async function changePin(currentPin, newPin) {
    const res = await unlockWithPin(currentPin);
    if (!res.ok) return false;
    const meta = await getMeta();
    await setupPin(newPin, res.refreshToken);
    if (meta.biometricEnabled) await enableBiometric(res.refreshToken);
    pinRef.current = newPin;
    return true;
  }

  // Parametrlər → Təhlükəsizlik: biometrikanı aç/bağla.
  async function setBiometricEnabled(enabled) {
    if (enabled) {
      if (!refreshRef.current) return false;
      return enableBiometric(refreshRef.current);
    }
    await disableBiometric();
    return true;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        locked,
        needsPinSetup,
        login,
        logout,
        unlock,
        lockNow,
        refreshUser,
        completePinSetup,
        persistRotatedRefresh,
        setBiometricEnabled,
        changePin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
