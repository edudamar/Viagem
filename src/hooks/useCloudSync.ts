import { useState, useEffect, useCallback, useRef } from "react";
import { signInAnonymously, onAuthStateChanged, type User } from "firebase/auth";
import { doc, setDoc, onSnapshot, getDoc, collection, getDocs, deleteDoc } from "firebase/firestore";
import { auth, db } from "@/config/firebase";
import type { Viagem } from "@/types";

export type SyncStatus = "offline" | "connecting" | "connected" | "syncing" | "error";

function prepararParaSync(v: Viagem) {
  const { capaUrl, ...rest } = v;
  return rest;
}

function gerarCodigo(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 9; i++) {
    if (i === 3 || i === 6) code += "-";
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function useCloudSync() {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<SyncStatus>("offline");
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncCode, setSyncCode] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("meu-roteiro-sync-code");
    if (saved) setSyncCode(saved);
  }, []);

  useEffect(() => {
    setStatus("connecting");
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        if (!syncCode) setStatus("offline");
        else setStatus("connected");
      } else {
        setStatus("offline");
      }
    });
    return () => unsub();
  }, [syncCode]);

  const login = useCallback(async () => {
    try {
      setStatus("connecting");
      await signInAnonymously(auth);
    } catch (err) {
      console.error("Erro ao fazer login anônimo:", err);
      setStatus("error");
    }
  }, []);

  const gerarNovoCodigo = useCallback(async () => {
    if (!user) await login();
    const code = gerarCodigo();
    setSyncCode(code);
    localStorage.setItem("meu-roteiro-sync-code", code);
    setStatus("connected");
    return code;
  }, [user, login]);

  const conectarComCodigo = useCallback(async (code: string) => {
    const normalized = code.replace(/-/g, "").toUpperCase();
    if (normalized.length !== 9) return false;
    const formatted = normalized.slice(0, 3) + "-" + normalized.slice(3, 6) + "-" + normalized.slice(6);
    if (!user) await login();
    setSyncCode(formatted);
    localStorage.setItem("meu-roteiro-sync-code", formatted);
    setStatus("connected");
    return true;
  }, [user, login]);

  const desconectar = useCallback(() => {
    unsubscribeRef.current?.();
    unsubscribeRef.current = null;
    setSyncCode(null);
    localStorage.removeItem("meu-roteiro-sync-code");
    setStatus("offline");
  }, []);

  const pushTrips = useCallback(async (viagens: Viagem[]) => {
    if (!user || !syncCode) return;
    setStatus("syncing");
    try {
      const now = Date.now();
      for (const v of viagens) {
        const ref = doc(db, "sync", syncCode, "trips", v.id);
        await setDoc(ref, { ...prepararParaSync(v), _updatedAt: now });
      }
      setLastSync(new Date());
      setStatus("connected");
    } catch (err) {
      console.error("Erro ao enviar viagens:", err);
      setStatus("error");
    }
  }, [user, syncCode]);

  const pullTrips = useCallback(async (): Promise<Viagem[]> => {
    if (!user || !syncCode) return [];
    setStatus("syncing");
    try {
      const snap = await getDocs(collection(db, "sync", syncCode, "trips"));
      const trips: Viagem[] = [];
      snap.forEach((d) => trips.push(d.data() as Viagem));
      setLastSync(new Date());
      setStatus("connected");
      return trips;
    } catch (err) {
      console.error("Erro ao buscar viagens:", err);
      setStatus("error");
      return [];
    }
  }, [user, syncCode]);

  const pushTrip = useCallback(async (viagem: Viagem) => {
    if (!user || !syncCode) return;
    setStatus("syncing");
    try {
      const ref = doc(db, "sync", syncCode, "trips", viagem.id);
      await setDoc(ref, { ...prepararParaSync(viagem), _updatedAt: Date.now() });
      setLastSync(new Date());
      setStatus("connected");
    } catch (err) {
      console.error("Erro ao enviar viagem:", err);
      setStatus("error");
    }
  }, [user, syncCode]);

  const pullTrip = useCallback(async (tripId: string): Promise<Viagem | null> => {
    if (!user || !syncCode) return null;
    try {
      const ref = doc(db, "sync", syncCode, "trips", tripId);
      const snap = await getDoc(ref);
      if (snap.exists()) return snap.data() as Viagem;
      return null;
    } catch (err) {
      console.error("Erro ao buscar viagem:", err);
      return null;
    }
  }, [user, syncCode]);

  const deleteTrip = useCallback(async (tripId: string) => {
    if (!user || !syncCode) return;
    try {
      const ref = doc(db, "sync", syncCode, "trips", tripId);
      await deleteDoc(ref);
    } catch (err) {
      console.error("Erro ao excluir viagem:", err);
    }
  }, [user, syncCode]);

  const subscribeToTrips = useCallback((callback: (trips: Viagem[]) => void) => {
    if (!user || !syncCode) return () => {};
    const ref = collection(db, "sync", syncCode, "trips");
    const unsub = onSnapshot(ref, (snap) => {
      const trips: Viagem[] = [];
      snap.forEach((d) => trips.push(d.data() as Viagem));
      setLastSync(new Date());
      callback(trips);
    }, (err) => {
      console.error("Erro no listener de viagens:", err);
      setStatus("error");
    });
    unsubscribeRef.current = unsub;
  }, [user, syncCode]);

  useEffect(() => {
    return () => { unsubscribeRef.current?.(); };
  }, []);

  return { user, status, lastSync, syncCode, login, gerarNovoCodigo, conectarComCodigo, desconectar, pushTrips, pullTrips, pushTrip, pullTrip, deleteTrip, subscribeToTrips };
}
