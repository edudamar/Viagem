import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Plane, Upload, Cloud, Download, Clipboard, FileJson, Copy, RefreshCw, Link2, Unlink } from "lucide-react";
import { useTrip } from "@/context/TripContext";
import { useCloud } from "@/context/CloudContext";
import { TripCard } from "@/components/TripCard";
import { Modal } from "@/components/Modal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { QRCodeModal } from "@/components/QRCodeModal";
import { SyncStatus } from "@/components/SyncStatus";
import { SpeechButton } from "@/components/SpeechButton";
import { maskCurrency, parseCurrency, maskDate, parseDate, unmaskDate, blurCurrency, focusCurrency } from "@/utils/masks";
import type { NovaViagemInput, Viagem } from "@/types";

export default function HomePage() {
  const { viagens, criarViagem, updateViagemById, removerViagem, importarViagem, importarViagemComo, importarTodas, verificarViagemExiste } = useTrip();
  const { status, lastSync, syncEnabled, syncCode, enableSync, gerarNovoCodigo, conectarComCodigo, desconectar, syncNow } = useCloud();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const destRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [editTrip, setEditTrip] = useState<Viagem | null>(null);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [importError, setImportError] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [qrTrip, setQrTrip] = useState<Viagem | null>(null);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [pendingImport, setPendingImport] = useState<{ data: string; nome: string } | null>(null);
  const [syncCodeInput, setSyncCodeInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [form, setForm] = useState<NovaViagemInput>({ destino: "", inicio: "", fim: "", orcamento: 5000 });
  const [orcamentoStr, setOrcamentoStr] = useState("5.000");
  const [inicioStr, setInicioStr] = useState("");
  const [fimStr, setFimStr] = useState("");

  const processImport = (text: string) => {
    try {
      const data = JSON.parse(text);
      if (Array.isArray(data)) {
        const ok = importarTodas(text);
        setImportSuccess(ok);
        setImportError(!ok);
        setTimeout(() => { setImportError(false); setImportSuccess(false); }, 3000);
        setShowImportModal(false);
        setPasteText("");
      } else {
        const dados = data as Partial<Viagem>;
        if (dados.destino) {
          const existente = verificarViagemExiste(dados.destino);
          if (existente) {
            setPendingImport({ data: text, nome: dados.destino });
            setShowConflictModal(true);
            setShowImportModal(false);
            setPasteText("");
            return;
          }
        }
        const ok = importarViagem(text);
        setImportSuccess(ok);
        setImportError(!ok);
        setTimeout(() => { setImportError(false); setImportSuccess(false); }, 3000);
        setShowImportModal(false);
        setPasteText("");
      }
    } catch {
      setImportError(true);
      setTimeout(() => setImportError(false), 3000);
    }
  };

  const handleConflictResolve = (modo: "sobrescrever" | "copiar") => {
    if (!pendingImport) return;
    const ok = importarViagemComo(pendingImport.data, modo);
    setImportSuccess(ok);
    setImportError(!ok);
    setTimeout(() => { setImportError(false); setImportSuccess(false); }, 3000);
    setShowConflictModal(false);
    setPendingImport(null);
  };

  const handleCreate = () => {
    const inicio = parseDate(inicioStr);
    const fim = parseDate(fimStr);
    if (!form.destino || !inicio || !fim) return;
    const id = criarViagem({ ...form, inicio, fim, orcamento: parseCurrency(orcamentoStr) });
    setOpen(false);
    setForm({ destino: "", inicio: "", fim: "", orcamento: 5000 });
    setInicioStr(""); setFimStr(""); setOrcamentoStr("5.000");
    navigate(`/${id}`);
  };

  const openEdit = (v: Viagem) => {
    setEditTrip(v);
    setForm({ destino: v.destino, inicio: v.inicio, fim: v.fim, orcamento: v.orcamento });
    setInicioStr(unmaskDate(v.inicio));
    setFimStr(unmaskDate(v.fim));
    setOrcamentoStr(maskCurrency(String(v.orcamento)));
    setOpen(true);
    setTimeout(() => destRef.current?.focus(), 100);
  };

  const handleEdit = () => {
    if (!editTrip) return;
    const inicio = parseDate(inicioStr);
    const fim = parseDate(fimStr);
    if (!form.destino || !inicio || !fim) return;
    updateViagemById(editTrip.id, { ...form, inicio, fim, orcamento: parseCurrency(orcamentoStr) });
    setOpen(false);
    setEditTrip(null);
    setForm({ destino: "", inicio: "", fim: "", orcamento: 5000 });
    setInicioStr(""); setFimStr(""); setOrcamentoStr("5.000");
  };

  const handleRemove = () => { if (removeId) { removerViagem(removeId); setRemoveId(null); } };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => processImport(reader.result as string);
    reader.readAsText(file);
    e.target.value = "";
  };

  const handlePasteImport = () => {
    if (!pasteText.trim()) return;
    processImport(pasteText);
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setPasteText(text);
    } catch {
      // clipboard not available
    }
  };

  const handleExportAll = () => {
    const data = JSON.stringify(viagens, null, 2);
    const blob = new Blob([data], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup_roteiro_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openCreate = () => {
    setEditTrip(null);
    setForm({ destino: "", inicio: "", fim: "", orcamento: 5000 });
    setInicioStr(""); setFimStr(""); setOrcamentoStr("5.000");
    setOpen(true);
    setTimeout(() => destRef.current?.focus(), 100);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Minhas Viagens</h1>
          <p className="text-text-muted text-sm">{viagens.length} viagem{viagens.length !== 1 && "s"}</p>
          {importError && <p className="text-red-500 text-xs mt-1">JSON inválido. Verifique o texto copiado.</p>}
          {importSuccess && <p className="text-green-600 text-xs mt-1">Importado com sucesso!</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SyncStatus status={status} lastSync={lastSync} onSync={syncEnabled ? syncNow : () => setShowSyncModal(true)} />
          <button onClick={handleExportAll} className="bg-surface border border-border flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium shadow-sm hover:bg-gray-50" title="Baixar backup">
            <Download className="h-4 w-4" /> Backup
          </button>
          <button onClick={() => setShowImportModal(true)} className="bg-surface border border-border flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium shadow-sm hover:bg-gray-50">
            <Upload className="h-4 w-4" /> Importar
          </button>
          <button onClick={openCreate} className="bg-primary flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-primary-dark">
            <Plus className="h-4 w-4" /> Nova Viagem
          </button>
        </div>
      </div>

      {viagens.length === 0 ? (
        <EmptyState icon={<Plane className="h-16 w-16" />} title="Nenhuma viagem ainda" description="Crie sua primeira viagem para começar a planejar"
          action={<button onClick={openCreate} className="bg-primary rounded-lg px-4 py-2 text-sm font-medium text-white">Criar Viagem</button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {viagens.map((v) => (
            <TripCard key={v.id} viagem={v} onEdit={() => openEdit(v)} onRemove={() => setRemoveId(v.id)} onQR={() => setQrTrip(v)} />
          ))}
        </div>
      )}

      {/* Modal Importar */}
      <Modal open={showImportModal} onClose={() => { setShowImportModal(false); setPasteText(""); }} title="Importar Viagem">
        <div className="flex flex-col gap-4">
          <p className="text-text-muted text-sm">Importe seus dados de viagem de duas formas:</p>

          {/* Opção 1: Arquivo */}
          <div className="border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileJson className="h-5 w-5 text-primary" />
              <h4 className="font-medium text-sm">Arquivo</h4>
            </div>
            <p className="text-xs text-gray-500 mb-3">Selecione um arquivo .txt baixado do backup</p>
            <button onClick={() => fileRef.current?.click()} className="w-full rounded-lg border border-border py-2.5 text-sm font-medium hover:bg-gray-50">
              Selecionar Arquivo
            </button>
            <input ref={fileRef} type="file" accept=".json,.txt" className="hidden" onChange={handleImportFile} />
          </div>

          {/* Opção 2: Colar texto */}
          <div className="border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clipboard className="h-5 w-5 text-primary" />
              <h4 className="font-medium text-sm">Colar JSON</h4>
            </div>
            <p className="text-xs text-gray-500 mb-3">Copie o texto JSON do WhatsApp e cole aqui</p>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder='Cole aqui o JSON copiado...'
              className="w-full rounded-lg border border-border p-3 text-xs font-mono resize-none"
              rows={5}
            />
            <div className="flex gap-2 mt-3">
              <button onClick={handlePasteFromClipboard} className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-border py-2.5 text-sm font-medium hover:bg-gray-50">
                <Clipboard className="h-4 w-4" /> Colar
              </button>
              <button onClick={handlePasteImport} disabled={!pasteText.trim()} className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50">
                Importar
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal Conflito - Viagem já existe */}
      <Modal open={showConflictModal} onClose={() => { setShowConflictModal(false); setPendingImport(null); }} title="Viagem já existe">
        <div className="flex flex-col gap-4">
          <p className="text-text-muted text-sm">
            Já existe uma viagem chamada <strong>"{pendingImport?.nome}"</strong> neste dispositivo.
          </p>
          <p className="text-text-muted text-sm">O que você deseja fazer?</p>

          <button onClick={() => handleConflictResolve("sobrescrever")} className="flex items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-medium text-white hover:bg-primary-dark">
            <RefreshCw className="h-4 w-4" /> Sobrescrever existente
          </button>

          <button onClick={() => handleConflictResolve("copiar")} className="flex items-center justify-center gap-2 rounded-lg border border-border py-3 text-sm font-medium hover:bg-gray-50">
            <Copy className="h-4 w-4" /> Salvar como cópia
          </button>

          <button onClick={() => { setShowConflictModal(false); setPendingImport(null); }} className="text-text-muted text-sm font-medium hover:underline">
            Cancelar
          </button>
        </div>
      </Modal>

      {/* Modal Criar/Editar */}
      <Modal open={open} onClose={() => { setOpen(false); setEditTrip(null); }} title={editTrip ? "Editar Viagem" : "Nova Viagem"}>
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-text-muted mb-1 block text-xs font-medium">Destino</label>
            <div className="flex gap-2">
              <input ref={destRef} value={form.destino} onChange={(e) => setForm({ ...form, destino: e.target.value })} placeholder="Ex: Lisboa, Portugal" className="w-full" />
              <SpeechButton onResult={(t) => setForm({ ...form, destino: form.destino + t })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-text-muted mb-1 block text-xs font-medium">Início</label>
              <input value={inicioStr} onChange={(e) => setInicioStr(maskDate(e.target.value))} placeholder="dd/mm/aaaa" maxLength={10} className="w-full" />
            </div>
            <div>
              <label className="text-text-muted mb-1 block text-xs font-medium">Fim</label>
              <input value={fimStr} onChange={(e) => setFimStr(maskDate(e.target.value))} placeholder="dd/mm/aaaa" maxLength={10} className="w-full" />
            </div>
          </div>
          <div>
            <label className="text-text-muted mb-1 block text-xs font-medium">Orçamento (R$)</label>
            <input value={orcamentoStr} onChange={(e) => setOrcamentoStr(maskCurrency(e.target.value))} onBlur={(e) => setOrcamentoStr(blurCurrency(e.target.value))} onFocus={focusCurrency} placeholder="0" className="w-full" />
          </div>
          <button onClick={editTrip ? handleEdit : handleCreate} disabled={!form.destino || !parseDate(inicioStr) || !parseDate(fimStr)}
            className="bg-primary w-full rounded-lg py-2.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50">
            {editTrip ? "Salvar" : "Criar Viagem"}
          </button>
        </div>
      </Modal>

      {/* Modal Sync */}
      <Modal open={showSyncModal} onClose={() => { setShowSyncModal(false); setCopied(false); }} title="Sincronização na Nuvem">
        <div className="flex flex-col gap-4">
          {syncEnabled && syncCode ? (
            <div className="flex flex-col gap-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs font-medium mb-2">Seu código de sincronização:</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white border border-border rounded-lg px-3 py-2 text-center font-mono text-lg tracking-wider font-bold">{syncCode}</div>
                  <button onClick={() => { navigator.clipboard.writeText(syncCode); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="bg-gray-200 hover:bg-gray-300 rounded-lg px-3 py-2 text-xs font-medium shrink-0">
                    {copied ? "Copiado!" : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-gray-400 mt-2">Use este código no outro dispositivo para sincronizar</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs font-medium">Status: <span className={status === "connected" ? "text-green-600" : status === "syncing" ? "text-blue-600" : "text-yellow-600"}>{status === "connected" ? "Conectado" : status === "syncing" ? "Sincronizando..." : status === "error" ? "Erro" : "Conectando..."}</span></p>
                {lastSync && <p className="text-xs text-gray-500 mt-1">Último sync: {lastSync.toLocaleTimeString("pt-BR")}</p>}
              </div>
              <button onClick={syncNow} className="bg-primary w-full rounded-lg py-2.5 text-sm font-medium text-white hover:bg-primary-dark flex items-center justify-center gap-2"><RefreshCw className="h-4 w-4" /> Sincronizar</button>
              <button onClick={() => { desconectar(); setShowSyncModal(false); }} className="text-red-500 text-xs font-medium hover:underline">Desconectar</button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-text-muted text-sm">Sincronize seus dados entre dispositivos usando um código compartilhado.</p>
              <button onClick={async () => { await gerarNovoCodigo(); }} className="bg-primary w-full rounded-lg py-2.5 text-sm font-medium text-white hover:bg-primary-dark flex items-center justify-center gap-2"><Link2 className="h-4 w-4" /> Gerar Novo Código</button>
              <div className="relative flex items-center justify-center">
                <div className="border-t border-border flex-1" />
                <span className="text-text-muted px-2 text-xs">ou</span>
                <div className="border-t border-border flex-1" />
              </div>
              <div>
                <label className="text-text-muted mb-1 block text-xs font-medium">Digite o código do outro dispositivo</label>
                <input value={syncCodeInput} onChange={(e) => setSyncCodeInput(e.target.value.toUpperCase())} placeholder="ABC-123-XYZ" maxLength={11} className="w-full text-center font-mono tracking-wider" />
              </div>
              <button onClick={async () => { const ok = await conectarComCodigo(syncCodeInput); if (ok) setShowSyncModal(false); }} disabled={syncCodeInput.replace(/-/g, "").length !== 9} className="bg-primary w-full rounded-lg py-2.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50 flex items-center justify-center gap-2"><Link2 className="h-4 w-4" /> Conectar</button>
            </div>
          )}
        </div>
      </Modal>

      <QRCodeModal open={!!qrTrip} onClose={() => setQrTrip(null)} viagem={qrTrip} />
      <ConfirmDialog open={!!removeId} onClose={() => setRemoveId(null)} onConfirm={handleRemove} title="Excluir viagem?" message="Todos os dados desta viagem serão perdidos." />
    </div>
  );
}
