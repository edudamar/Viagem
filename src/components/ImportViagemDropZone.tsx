import { useState, useRef, useCallback } from "react";
import { Upload, FileJson, AlertCircle, CheckCircle, ImageOff, Copy, RefreshCw } from "lucide-react";
import { useTrip } from "@/context/TripContext";
import type { Viagem } from "@/types";

type Preview = {
  destino: string;
  inicio: string;
  fim: string;
  dias: number;
  atividades: number;
  lancamentos: number;
  hasCapa: boolean;
  hasFotos: boolean;
  tamanhoKB: number;
};

function parsePreview(text: string): Preview | null {
  try {
    const data = JSON.parse(text);
    if (Array.isArray(data)) return null;
    const v = data as Partial<Viagem>;
    if (!v.destino || !v.inicio || !v.fim) return null;
    const atividades = (v.dias ?? []).reduce((s: number, d: any) => s + (d.atividades?.length ?? 0), 0);
    const hasCapa = !!v.capaUrl;
    const hasFotos = (v.dias ?? []).some((d: any) => d.atividades?.some((a: any) => a.fotos?.length > 0));
    const tamanhoKB = Math.round(new Blob([text]).size / 1024);
    const nDias = Math.round(
      (new Date(v.fim + "T00:00:00").getTime() - new Date(v.inicio + "T00:00:00").getTime()) / 86400000,
    ) + 1;
    return {
      destino: v.destino,
      inicio: v.inicio,
      fim: v.fim,
      dias: nDias,
      atividades,
      lancamentos: (v.lancamentos ?? []).length,
      hasCapa,
      hasFotos,
      tamanhoKB,
    };
  } catch {
    return null;
  }
}

function stripPhotos(text: string): string {
  try {
    const data = JSON.parse(text);
    data.capaUrl = undefined;
    for (const d of data.dias ?? []) {
      for (const a of d.atividades ?? []) {
        if (a.fotos?.length) a.fotos = [];
      }
    }
    return JSON.stringify(data, null, 2);
  } catch {
    return text;
  }
}

type Props = {
  onImported?: () => void;
};

export function ImportViagemDropZone({ onImported }: Props) {
  const {
    importarViagem,
    importarViagemComo,
    verificarViagemExiste,
  } = useTrip();

  const fileRef = useRef<HTMLInputElement>(null);
  const [rawText, setRawText] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [stripPhotosMode, setStripPhotosMode] = useState(false);
  const [conflict, setConflict] = useState<Viagem | null>(null);

  const handleFile = useCallback((file: File) => {
    setError(false);
    setSuccess(false);
    setConflict(null);
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const p = parsePreview(text);
      if (!p) { setError(true); return; }
      setRawText(text);
      setPreview(p);
      setStripPhotosMode(p.tamanhoKB > 2000);
    };
    reader.readAsText(file);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const doImport = () => {
    if (!rawText || !preview) return;
    const text = stripPhotosMode ? stripPhotos(rawText) : rawText;
    const existente = verificarViagemExiste(preview.destino);
    if (existente) {
      setConflict(existente);
      return;
    }
    const ok = importarViagem(text);
    if (ok) {
      setSuccess(true);
      setPreview(null);
      setRawText("");
      setTimeout(() => setSuccess(false), 3000);
      onImported?.();
    } else {
      setError(true);
    }
  };

  const doConflict = (modo: "sobrescrever" | "copiar") => {
    if (!rawText || !preview) return;
    const text = stripPhotosMode ? stripPhotos(rawText) : rawText;
    const ok = importarViagemComo(text, modo);
    if (ok) {
      setSuccess(true);
      setPreview(null);
      setRawText("");
      setConflict(null);
      setTimeout(() => setSuccess(false), 3000);
      onImported?.();
    } else {
      setError(true);
    }
  };

  const cancel = () => {
    setPreview(null);
    setRawText("");
    setError(false);
    setConflict(null);
  };

  return (
    <div className="w-full">
      {!preview ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
            dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-gray-50"
          }`}
        >
          <div className="bg-primary/10 rounded-full p-3">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">Arraste um arquivo .txt ou .json aqui</p>
            <p className="text-text-muted mt-1 text-xs">ou clique para selecionar</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".txt,.json,application/json"
            className="hidden"
            onChange={onFileInput}
          />
        </div>
      ) : (
        <div className="rounded-2xl border border-border p-4 space-y-4">
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 rounded-full p-2 shrink-0">
              <FileJson className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-semibold truncate">{preview.destino}</h4>
              <p className="text-text-muted text-xs">
                {preview.inicio} a {preview.fim} ({preview.dias} dias)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-gray-50 rounded-lg p-2">
              <p className="text-lg font-bold">{preview.dias}</p>
              <p className="text-text-muted text-[10px]">dias</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2">
              <p className="text-lg font-bold">{preview.atividades}</p>
              <p className="text-text-muted text-[10px]">atividades</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2">
              <p className="text-lg font-bold">{preview.lancamentos}</p>
              <p className="text-text-muted text-[10px]">lançamentos</p>
            </div>
          </div>

          <div className="text-text-muted flex flex-wrap gap-2 text-[11px]">
            <span>Tamanho: {preview.tamanhoKB} KB</span>
            {preview.hasCapa && <span>• Capa com imagem</span>}
            {preview.hasFotos && <span>• Fotos nas atividades</span>}
          </div>

          {(preview.hasCapa || preview.hasFotos) && (
            <label className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 p-2 cursor-pointer">
              <input
                type="checkbox"
                checked={stripPhotosMode}
                onChange={(e) => setStripPhotosMode(e.target.checked)}
                className="accent-amber-600"
              />
              <ImageOff className="h-4 w-4 text-amber-600 shrink-0" />
              <span className="text-xs text-amber-800">
                Remover fotos para economizar espaço ({preview.tamanhoKB} KB → menor)
              </span>
            </label>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-2 text-xs text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Erro ao importar. Verifique se o arquivo é válido.
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 p-2 text-xs text-green-600">
              <CheckCircle className="h-4 w-4 shrink-0" />
              Viagem importada com sucesso!
            </div>
          )}

          {!conflict ? (
            <div className="flex gap-2">
              <button onClick={cancel} className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={doImport} className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-medium text-white hover:bg-primary-dark">
                Importar
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-amber-700 font-medium">
                Já existe uma viagem "{conflict.destino}" neste dispositivo.
              </p>
              <button onClick={() => doConflict("sobrescrever")} className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-medium text-white hover:bg-primary-dark">
                <RefreshCw className="h-4 w-4" /> Sobrescrever existente
              </button>
              <button onClick={() => doConflict("copiar")} className="w-full flex items-center justify-center gap-2 rounded-lg border border-border py-2.5 text-sm font-medium hover:bg-gray-50">
                <Copy className="h-4 w-4" /> Salvar como cópia
              </button>
              <button onClick={cancel} className="w-full text-text-muted text-xs font-medium hover:underline">
                Cancelar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
