import { useRef } from "react";
import { Clock, MapPin, DollarSign, Trash2, Edit3, Camera, X, Navigation } from "lucide-react";
import type { Atividade } from "@/types";
import { fmtMoney, cn } from "@/utils/helpers";
import { googleMapsUrl } from "@/utils/mapStatic";

type Props = {
  atividade: Atividade;
  onEdit: () => void;
  onRemove: () => void;
  onAddPhoto: (dataUrl: string) => void;
  onRemovePhoto: (index: number) => void;
};

export function ActivityCard({ atividade, onEdit, onRemove, onAddPhoto, onRemovePhoto }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onAddPhoto(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="bg-surface rounded-xl border border-border p-3">
      <div className="flex items-start gap-3">
        <div className="bg-primary/10 flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg">
          <Clock className="text-primary h-3.5 w-3.5" />
          <span className="text-primary text-[10px] font-semibold">{atividade.hora}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium leading-tight">{atividade.titulo}</h4>
            <div className="flex gap-1">
              <button onClick={() => inputRef.current?.click()} className="text-text-muted hover:text-primary p-1" title="Adicionar foto">
                <Camera className="h-3.5 w-3.5" />
              </button>
              <button onClick={onEdit} className="text-text-muted hover:text-primary p-1">
                <Edit3 className="h-3.5 w-3.5" />
              </button>
              <button onClick={onRemove} className="text-text-muted hover:text-red-500 p-1">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <p className="text-text-muted flex items-center gap-1 text-xs">
            <MapPin className="h-3 w-3" />
            {atividade.local}
            {atividade.coord && (
              <a href={googleMapsUrl(atividade.coord)} target="_blank" rel="noopener noreferrer" className="text-primary ml-1 inline-flex items-center gap-0.5 hover:underline" title="Abrir no Google Maps">
                <Navigation className="h-3 w-3" />
              </a>
            )}
          </p>
          {atividade.notas && <p className="text-text-muted mt-1 text-xs italic">{atividade.notas}</p>}
          {atividade.custo > 0 && (
            <span className="text-primary mt-1 inline-flex items-center gap-0.5 text-xs font-medium">
              <DollarSign className="h-3 w-3" />
              {fmtMoney(atividade.custo)}
            </span>
          )}
          {atividade.nota && (
            <div className="mt-1 flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className={cn("text-xs", i < (atividade.nota ?? 0) ? "text-amber-400" : "text-gray-200")}>
                  ★
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      {atividade.fotos && atividade.fotos.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {atividade.fotos.map((foto, idx) => (
            <div key={idx} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg">
              <img src={foto} alt="" className="h-full w-full object-cover" />
              <button
                onClick={() => onRemovePhoto(idx)}
                className="absolute top-0.5 right-0.5 rounded-full bg-black/60 p-0.5 text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
    </div>
  );
}
