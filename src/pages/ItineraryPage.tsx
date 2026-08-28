import { useState, useRef } from "react";
import { Plus, BookOpen, MapPin } from "lucide-react";
import { useTrip } from "@/context/TripContext";
import { Header } from "@/components/Header";
import { ActivityCard } from "@/components/ActivityCard";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { nomeDiaSemana, fmtDataCurta, cn, limparNomeViagem } from "@/utils/helpers";
import { maskCurrency, parseCurrency, maskTime, blurCurrency, focusCurrency } from "@/utils/masks";
import { SpeechButton } from "@/components/SpeechButton";
import type { Atividade, Coord } from "@/types";

export default function ItineraryPage() {
  const { viagem, addAtividade, updateAtividade, removeAtividade, updateDiaMemorial, addFotoAtividade, removeFotoAtividade } = useTrip();
  const tituloRef = useRef<HTMLInputElement>(null);
  const [diaIdx, setDiaIdx] = useState(0);
  const [openAct, setOpenAct] = useState(false);
  const [editAct, setEditAct] = useState<Atividade | null>(null);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [horaStr, setHoraStr] = useState("10:00");
  const [custoStr, setCustoStr] = useState("0");
  const [form, setForm] = useState({ titulo: "", local: "", notas: "" });
  const [relatoForm, setRelatoForm] = useState("");
  const [coord, setCoord] = useState<Coord | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  const dia = viagem.dias[diaIdx];

  const openAdd = () => {
    setEditAct(null);
    setForm({ titulo: "", local: "", notas: "" });
    setHoraStr("10:00");
    setCustoStr("0");
    setCoord(null);
    setOpenAct(true);
    setTimeout(() => tituloRef.current?.focus(), 100);
  };

  const openEdit = (a: Atividade) => {
    setEditAct(a);
    setForm({ titulo: a.titulo, local: a.local, notas: a.notas ?? "" });
    setHoraStr(a.hora);
    setCustoStr(maskCurrency(String(a.custo)));
    setCoord(a.coord ?? null);
    setOpenAct(true);
    setTimeout(() => tituloRef.current?.focus(), 100);
  };

  const handleSave = () => {
    if (!form.titulo) return;
    const data: any = { ...form, hora: horaStr, custo: parseCurrency(custoStr) };
    if (coord) data.coord = coord;
    if (editAct) updateAtividade(diaIdx, editAct.id, data); else addAtividade(diaIdx, data);
    setOpenAct(false);
  };

  const handleGps = () => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoord({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsLoading(false);
      },
      () => setGpsLoading(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleRemove = () => { if (removeId) { removeAtividade(diaIdx, removeId); setRemoveId(null); } };

  return (
    <div>
      <Header title="Roteiro" subtitle={limparNomeViagem(viagem.destino)} />
      <div className="mx-auto max-w-4xl p-4 md:px-6">
        <div className="bg-surface mb-4 overflow-x-auto rounded-xl border border-border p-1">
          <div className="flex gap-1">
            {viagem.dias.map((d, i) => (
              <button key={i} onClick={() => setDiaIdx(i)} className={cn("shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition-colors", diaIdx === i ? "bg-primary text-white" : "text-text-muted hover:bg-gray-100")}>
                {fmtDataCurta(d.data)}{" "}
                <span className="opacity-60">({nomeDiaSemana(d.data)})</span>
              </button>
            ))}
          </div>
        </div>

        {dia && (
          <div className="space-y-4">
            {dia.relato !== undefined && (
              <div className="bg-surface rounded-xl border border-border p-4">
                <div className="mb-2 flex items-center gap-2">
                  <BookOpen className="text-primary h-4 w-4" />
                  <h3 className="text-sm font-medium">Memorial do Dia</h3>
                </div>
                <div className="flex gap-2">
                  <textarea value={relatoForm} onChange={(e) => setRelatoForm(e.target.value)} onBlur={() => updateDiaMemorial(diaIdx, { relato: relatoForm })} placeholder="Como foi seu dia?" className="w-full resize-none rounded-lg border border-border p-3 text-sm" rows={3} />
                  <SpeechButton onResult={(t) => setRelatoForm(relatoForm + t)} className="mt-2" />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Atividades ({dia.atividades.length})</h3>
              <button onClick={openAdd} className="bg-primary flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-white"><Plus className="h-3.5 w-3.5" /> Adicionar</button>
            </div>

            {dia.atividades.length === 0 ? (
              <EmptyState icon={<MapPinIcon />} title="Sem atividades" description="Adicione atividades para este dia" />
            ) : (
              <div className="space-y-2">
                {dia.atividades.map((a) => <ActivityCard key={a.id} atividade={a} onEdit={() => openEdit(a)} onRemove={() => setRemoveId(a.id)} onAddPhoto={(dataUrl) => addFotoAtividade(diaIdx, a.id, dataUrl)} onRemovePhoto={(idx) => removeFotoAtividade(diaIdx, a.id, idx)} />)}
              </div>
            )}
          </div>
        )}
      </div>

      <Modal open={openAct} onClose={() => setOpenAct(false)} title={editAct ? "Editar Atividade" : "Nova Atividade"}>
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-text-muted mb-1 block text-xs font-medium">Título</label>
            <div className="flex gap-2">
              <input ref={tituloRef} value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} className="w-full" placeholder="Ex: Visita ao museu" />
              <SpeechButton onResult={(t) => setForm({ ...form, titulo: form.titulo + t })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-text-muted mb-1 block text-xs font-medium">Hora</label>
              <input value={horaStr} onChange={(e) => setHoraStr(maskTime(e.target.value))} placeholder="hh:mm" maxLength={5} className="w-full" />
            </div>
            <div>
              <label className="text-text-muted mb-1 block text-xs font-medium">Custo (R$)</label>
              <input value={custoStr} onChange={(e) => setCustoStr(maskCurrency(e.target.value))} onBlur={(e) => setCustoStr(blurCurrency(e.target.value))} onFocus={focusCurrency} placeholder="0" className="w-full" />
            </div>
          </div>
          <div>
            <label className="text-text-muted mb-1 block text-xs font-medium">Local</label>
            <div className="flex gap-2">
              <input value={form.local} onChange={(e) => setForm({ ...form, local: e.target.value })} className="w-full" placeholder="Ex: Museu Nacional" />
              <SpeechButton onResult={(t) => setForm({ ...form, local: form.local + t })} />
            </div>
          </div>
          <div>
            <button onClick={handleGps} disabled={gpsLoading} type="button" className="flex items-center gap-1.5 rounded-lg border border-border bg-gray-50 px-3 py-2 text-xs font-medium text-text-muted hover:bg-gray-100 disabled:opacity-50">
              <MapPin className="h-3.5 w-3.5" />
              {gpsLoading ? "Obtendo localização..." : coord ? "Localização capturada ✓" : "Minha Localização"}
            </button>
            {coord && <p className="text-text-muted mt-1 text-[11px]">📍 {coord.lat.toFixed(6)}, {coord.lng.toFixed(6)}</p>}
          </div>
          <div>
            <label className="text-text-muted mb-1 block text-xs font-medium">Notas</label>
            <div className="flex gap-2">
              <textarea value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} className="w-full resize-none" rows={2} placeholder="Observações..." />
              <SpeechButton onResult={(t) => setForm({ ...form, notas: form.notas + t })} className="mt-2" />
            </div>
          </div>
          <button onClick={handleSave} disabled={!form.titulo} className="bg-primary w-full rounded-lg py-2.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50">
            {editAct ? "Salvar" : "Adicionar"}
          </button>
        </div>
      </Modal>
      <ConfirmDialog open={!!removeId} onClose={() => setRemoveId(null)} onConfirm={handleRemove} title="Remover atividade?" message="Esta ação não pode ser desfeita." />
    </div>
  );
}

function MapPinIcon() {
  return <svg className="h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>;
}
