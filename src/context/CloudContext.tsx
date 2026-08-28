import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react";
import { useCloudSync, type SyncStatus } from "@/hooks/useCloudSync";
import { useTrip } from "./TripContext";
import type { Viagem } from "@/types";

type CloudCtx = {
  status: SyncStatus;
  lastSync: Date | null;
  syncEnabled: boolean;
  syncCode: string | null;
  enableSync: () => Promise<void>;
  gerarNovoCodigo: () => Promise<string>;
  conectarComCodigo: (code: string) => Promise<boolean>;
  desconectar: () => void;
  syncNow: () => Promise<void>;
  importFromCloud: () => Promise<void>;
};

const CloudContext = createContext<CloudCtx | null>(null);

function mergeTrips(local: Viagem[], cloud: Viagem[], setViagem: (v: Viagem) => void, updateViagemById: (id: string, v: Viagem) => void) {
  for (const cloudTrip of cloud) {
    const localTrip = local.find((v) => v.id === cloudTrip.id);
    if (!localTrip) {
      setViagem(cloudTrip);
    } else {
      const cloudUpdated = cloudTrip._updatedAt ?? 0;
      const localUpdated = localTrip._updatedAt ?? 0;
      if (cloudUpdated > localUpdated) {
        updateViagemById(cloudTrip.id, cloudTrip);
      }
    }
  }
}

export function CloudProvider({ children }: { children: ReactNode }) {
  const { viagens, setViagem, updateViagemById } = useTrip();
  const { status, lastSync, syncCode, login, gerarNovoCodigo, conectarComCodigo: connectCode, desconectar: disconnect, pushTrips, pullTrips, subscribeToTrips } = useCloudSync();
  const [syncEnabled, setSyncEnabled] = useState(false);
  const viagensRef = useRef(viagens);
  viagensRef.current = viagens;

  useEffect(() => {
    const saved = localStorage.getItem("meu-roteiro-sync-code");
    if (saved && syncCode) {
      setSyncEnabled(true);
    }
  }, [syncCode]);

  useEffect(() => {
    if (!syncEnabled || !syncCode) return;
    const unsub = subscribeToTrips((cloudTrips) => {
      mergeTrips(viagensRef.current, cloudTrips, setViagem, updateViagemById);
    });
    return () => { unsub?.(); };
  }, [syncEnabled, syncCode, subscribeToTrips, setViagem, updateViagemById]);

  const enableSync = useCallback(async () => {
    await login();
    setSyncEnabled(true);
  }, [login]);

  const gerarCodigo = useCallback(async () => {
    if (!syncCode) await login();
    const code = await gerarNovoCodigo();
    setSyncEnabled(true);
    return code;
  }, [login, gerarNovoCodigo]);

  const conectarComCodigo = useCallback(async (code: string) => {
    const ok = await connectCode(code);
    if (ok) setSyncEnabled(true);
    return ok;
  }, [connectCode]);

  const desconectar = useCallback(() => {
    disconnect();
    setSyncEnabled(false);
  }, [disconnect]);

  const syncNow = useCallback(async () => {
    await pushTrips(viagensRef.current);
    const cloudTrips = await pullTrips();
    mergeTrips(viagensRef.current, cloudTrips, setViagem, updateViagemById);
  }, [pushTrips, pullTrips, setViagem, updateViagemById]);

  const importFromCloud = useCallback(async () => {
    const cloudTrips = await pullTrips();
    mergeTrips(viagensRef.current, cloudTrips, setViagem, updateViagemById);
  }, [pullTrips, setViagem, updateViagemById]);

  return (
    <CloudContext.Provider value={{ status, lastSync, syncEnabled, syncCode, enableSync, gerarNovoCodigo: gerarCodigo, conectarComCodigo, desconectar, syncNow, importFromCloud }}>
      {children}
    </CloudContext.Provider>
  );
}

export function useCloud() {
  const ctx = useContext(CloudContext);
  if (!ctx) throw new Error("useCloud must be used within CloudProvider");
  return ctx;
}
