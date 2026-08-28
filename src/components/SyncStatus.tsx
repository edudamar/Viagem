import { Cloud, CloudOff, RefreshCw, AlertCircle } from "lucide-react";
import type { SyncStatus as SyncStatusType } from "@/hooks/useCloudSync";
import { cn } from "@/utils/helpers";

export function SyncStatus({ status, lastSync, onSync }: { status: SyncStatusType; lastSync: Date | null; onSync?: () => void }) {
  const config: Record<SyncStatusType, { icon: React.ReactNode; label: string; color: string }> = {
    offline: { icon: <CloudOff className="h-4 w-4" />, label: "Offline", color: "text-gray-400" },
    connecting: { icon: <RefreshCw className="h-4 w-4 animate-spin" />, label: "Conectando...", color: "text-yellow-500" },
    connected: { icon: <Cloud className="h-4 w-4" />, label: "Conectado", color: "text-green-500" },
    syncing: { icon: <RefreshCw className="h-4 w-4 animate-spin" />, label: "Sincronizando...", color: "text-blue-500" },
    error: { icon: <AlertCircle className="h-4 w-4" />, label: "Erro", color: "text-red-500" },
  };

  const c = config[status];

  return (
    <button onClick={onSync} className={cn("flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors hover:bg-gray-100", c.color)} title={lastSync ? `Último sync: ${lastSync.toLocaleTimeString("pt-BR")}` : c.label}>
      {c.icon}
      <span className="hidden sm:inline">{c.label}</span>
    </button>
  );
}
