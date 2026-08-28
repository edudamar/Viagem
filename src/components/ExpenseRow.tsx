import { Trash2, Edit3, Tag } from "lucide-react";
import type { Lancamento, CategoriaFin } from "@/types";
import { fmtMoney, fmtDataCurta } from "@/utils/helpers";

type Props = {
  lancamento: Lancamento;
  categoria?: CategoriaFin;
  onEdit: () => void;
  onRemove: () => void;
};

export function ExpenseRow({ lancamento, categoria, onEdit, onRemove }: Props) {
  return (
    <div className="bg-surface flex items-center gap-3 rounded-xl border border-border p-3">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
        style={{ backgroundColor: categoria?.cor ?? "#94a3b8" }}
      >
        {categoria?.nome?.slice(0, 2).toUpperCase() ?? "??"}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h4 className="truncate text-sm font-medium">{lancamento.descricao}</h4>
          <div className="flex gap-1">
            <button onClick={onEdit} className="text-text-muted hover:text-primary p-1">
              <Edit3 className="h-3.5 w-3.5" />
            </button>
            <button onClick={onRemove} className="text-text-muted hover:text-red-500 p-1">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <div className="text-text-muted flex items-center gap-2 text-xs">
          <span>{fmtDataCurta(lancamento.data)}</span>
          {categoria && (
            <span className="flex items-center gap-0.5">
              <Tag className="h-3 w-3" />
              {categoria.nome}
            </span>
          )}
        </div>
      </div>
      <span className={`text-sm font-semibold ${lancamento.tipo === "receita" ? "text-green-600" : "text-red-500"}`}>
        {lancamento.tipo === "receita" ? "+" : "-"}{fmtMoney(lancamento.valor)}
      </span>
    </div>
  );
}
