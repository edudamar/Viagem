import { useRef } from "react";
import { MapPin, Calendar, Clock, Camera, Edit3, Trash2, MessageCircle, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { useTrip } from "@/context/TripContext";
import type { Viagem } from "@/types";
import { diasAte, fmtDataCurta, fmtMoney } from "@/utils/helpers";

type Props = {
  viagem: Viagem;
  onEdit: () => void;
  onRemove: () => void;
  onQR: () => void;
};

function downloadTrip(v: Viagem) {
  const data = JSON.stringify(v, null, 2);
  const blob = new Blob([data], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const now = new Date();
  const dataHora = `${now.getDate().toString().padStart(2, "0")}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now.getFullYear()}_${now.getHours().toString().padStart(2, "0")}-${now.getMinutes().toString().padStart(2, "0")}`;
  a.download = `viagem_${v.destino.replace(/[^a-zA-Z0-9]/g, "_")}_${dataHora}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

function shareWhatsApp(v: Viagem) {
  const totalGasto = v.lancamentos.filter((l) => l.tipo === "despesa").reduce((s, l) => s + l.valor, 0);
  const totalAtividades = v.dias.reduce((s, d) => s + d.atividades.length, 0);
  const dias = v.dias.length;
  const checklistDone = v.checklist.filter((c) => c.done).length;

  const text = [
    `✈ *${v.destino}*`,
    `📅 ${v.inicio} a ${v.fim} (${dias} dias)`,
    `💰 Orçamento: ${fmtMoney(v.orcamento)}`,
    `💸 Gasto: ${fmtMoney(totalGasto)}`,
    `🎯 ${totalAtividades} atividades planejadas`,
    `✅ Checklist: ${checklistDone}/${v.checklist.length}`,
    ``,
    `_Para importar, abra o app e clique em Importar._`,
  ].join("%0A");

  window.location.href = `https://wa.me/?text=${text}`;
}

export function TripCard({ viagem, onEdit, onRemove, onQR }: Props) {
  const { updateViagemById } = useTrip();
  const inputRef = useRef<HTMLInputElement>(null);
  const dias = diasAte(viagem.inicio);
  const totalDias = Math.round(
    (new Date(viagem.fim + "T00:00:00").getTime() - new Date(viagem.inicio + "T00:00:00").getTime()) / 86400000,
  ) + 1;

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { updateViagemById(viagem.id, { capaUrl: reader.result as string }); };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="group bg-surface relative overflow-hidden rounded-2xl border border-border shadow-sm transition-all hover:shadow-md">
      <Link to={`/${viagem.id}`} className="block">
        {viagem.capaUrl ? (
          <div className="h-36 overflow-hidden">
            <img src={viagem.capaUrl} alt={viagem.destino} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
          </div>
        ) : (
          <div className="flex h-36 items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <MapPin className="text-primary/40 h-12 w-12" />
          </div>
        )}
        <div className="p-4">
          <h3 className="truncate text-lg font-semibold">{viagem.destino}</h3>
          {viagem.dataImportacao && (
            <p className="text-text-muted mt-0.5 text-[10px]">
              Importado em {new Date(viagem.dataImportacao).toLocaleDateString("pt-BR")} às {new Date(viagem.dataImportacao).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
          <div className="text-text-muted mt-1 flex flex-wrap gap-3 text-sm">
            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{fmtDataCurta(viagem.inicio)} — {fmtDataCurta(viagem.fim)}</span>
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{totalDias} dias</span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-text-muted text-xs">{viagem.lancamentos.length} lançamentos</span>
            <span className="text-primary text-sm font-medium">{fmtMoney(viagem.orcamento)}</span>
          </div>
          {dias > 0 && <div className="bg-primary/10 text-primary mt-2 rounded-full px-2 py-0.5 text-center text-xs font-medium">Faltam {dias} dias</div>}
        </div>
      </Link>

      {/* Botões de ação - sempre visíveis no mobile */}
      <div className="absolute top-2 right-2 z-10 flex gap-1 md:opacity-0 md:transition-opacity md:group-hover:opacity-100">
        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); inputRef.current?.click(); }} className="rounded-full bg-black/50 p-2 text-white hover:bg-black/70" title="Imagem">
          <Camera className="h-4 w-4" />
        </button>
        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(); }} className="rounded-full bg-black/50 p-2 text-white hover:bg-black/70" title="Editar">
          <Edit3 className="h-4 w-4" />
        </button>
        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(); }} className="rounded-full bg-red-500/70 p-2 text-white hover:bg-red-600" title="Excluir">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Botões inferiores - sempre visíveis */}
      <div className="absolute bottom-2 right-2 z-10 flex gap-1">
        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); downloadTrip(viagem); }} className="rounded-full bg-blue-500 p-2 text-white shadow-md hover:bg-blue-600" title="Baixar arquivo">
          <Download className="h-4 w-4" />
        </button>
        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); shareWhatsApp(viagem); }} className="rounded-full bg-green-500 p-2 text-white shadow-md hover:bg-green-600" title="WhatsApp">
          <MessageCircle className="h-4 w-4" />
        </button>
        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onQR(); }} className="rounded-full bg-gray-700 p-2 text-white shadow-md hover:bg-gray-800" title="QR Code">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="3" height="3" /><line x1="21" y1="14" x2="21" y2="21" /><line x1="14" y1="21" x2="21" y2="21" /></svg>
        </button>
      </div>

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
    </div>
  );
}
