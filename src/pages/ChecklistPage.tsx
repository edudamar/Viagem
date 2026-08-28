import { useState } from "react";
import { Plus, Trash2, Edit3 } from "lucide-react";
import { useTrip } from "@/context/TripContext";
import { Header } from "@/components/Header";
import { ChecklistGroup } from "@/components/ChecklistGroup";
import { Modal } from "@/components/Modal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { cn } from "@/utils/helpers";
import { SpeechButton } from "@/components/SpeechButton";
import type { ChecklistItem } from "@/types";

export default function ChecklistPage() {
  const {
    viagem,
    toggleChecklist,
    addChecklistItem,
    removeChecklistItem,
    addGrupoChecklist,
    updateGrupoChecklist,
    removeGrupoChecklist,
  } = useTrip();

  const [openItem, setOpenItem] = useState(false);
  const [openGrupo, setOpenGrupo] = useState(false);
  const [editGrupo, setEditGrupo] = useState<string | null>(null);
  const [removeGrupoTarget, setRemoveGrupoTarget] = useState<string | null>(null);
  const [form, setForm] = useState({ grupo: "", titulo: "", urgente: false });
  const [grupoForm, setGrupoForm] = useState("");

  const grupos = viagem.gruposChecklist;

  const handleAddItem = () => {
    if (!form.titulo || !form.grupo) return;
    addChecklistItem({ grupo: form.grupo, titulo: form.titulo, done: false, urgente: form.urgente });
    setForm({ grupo: form.grupo, titulo: "", urgente: false });
    setOpenItem(false);
  };

  const handleAddGrupo = () => {
    if (!grupoForm.trim()) return;
    if (editGrupo) {
      updateGrupoChecklist(editGrupo, grupoForm.trim());
      setEditGrupo(null);
    } else {
      addGrupoChecklist(grupoForm.trim());
    }
    setGrupoForm("");
    setOpenGrupo(false);
  };

  const handleRemoveGrupo = () => {
    if (removeGrupoTarget) {
      removeGrupoChecklist(removeGrupoTarget);
      setRemoveGrupoTarget(null);
    }
  };

  const openEditGrupo = (nome: string) => {
    setEditGrupo(nome);
    setGrupoForm(nome);
    setOpenGrupo(true);
  };

  const total = viagem.checklist.length;
  const done = viagem.checklist.filter((c) => c.done).length;
  const subtitleText = `${done}/${total} concluido${done !== 1 ? "s" : ""}`;

  return (
    <div>
      <Header
        title="Checklist"
        subtitle={subtitleText}
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => { setEditGrupo(null); setGrupoForm(""); setOpenGrupo(true); }}
              className="bg-surface border border-border flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium"
            >
              <Plus className="h-3.5 w-3.5" /> Grupo
            </button>
            <button
              onClick={() => { setForm({ grupo: grupos[0] ?? "", titulo: "", urgente: false }); setOpenItem(true); }}
              className="bg-primary flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-white"
            >
              <Plus className="h-3.5 w-3.5" /> Item
            </button>
          </div>
        }
      />

      <div className="mx-auto max-w-4xl space-y-3 p-4 md:px-6">
        {/* Barra de progresso geral */}
        <div className="bg-surface rounded-xl border border-border p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium">Progresso Geral</span>
            <span className="text-text-muted text-xs">{total > 0 ? ((done / total) * 100).toFixed(0) : 0}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-gray-100">
            <div
              className="bg-primary h-full rounded-full transition-all"
              style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Grupos */}
        {grupos.length === 0 ? (
          <div className="bg-surface rounded-xl border border-border p-8 text-center">
            <p className="text-text-muted text-sm">Nenhum grupo criado.</p>
            <button
              onClick={() => { setGrupoForm(""); setOpenGrupo(true); }}
              className="text-primary mt-2 text-sm font-medium"
            >
              Criar primeiro grupo
            </button>
          </div>
        ) : (
          grupos.map((grupo) => {
            const items = viagem.checklist.filter((c) => c.grupo === grupo);
            return (
              <ChecklistGroup
                key={grupo}
                grupo={grupo}
                items={items}
                onToggle={toggleChecklist}
                onRemove={removeChecklistItem}
                onEdit={() => openEditGrupo(grupo)}
                onRemoveGroup={() => setRemoveGrupoTarget(grupo)}
              />
            );
          })
        )}
      </div>

      {/* Modal item */}
      <Modal open={openItem} onClose={() => setOpenItem(false)} title="Novo Item">
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-text-muted mb-1 block text-xs font-medium">Grupo</label>
            <select
              value={form.grupo}
              onChange={(e) => setForm({ ...form, grupo: e.target.value })}
              className="w-full"
            >
              <option value="">Selecione</option>
              {grupos.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-text-muted mb-1 block text-xs font-medium">Título</label>
            <div className="flex gap-2">
              <input
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                className="w-full"
                placeholder="Ex: Validar passaporte"
                onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
              />
              <SpeechButton onResult={(t) => setForm({ ...form, titulo: form.titulo + t })} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.urgente}
              onChange={(e) => setForm({ ...form, urgente: e.target.checked })}
              className="h-4 w-4 rounded"
            />
            Marcar como urgente
          </label>
          <button
            onClick={handleAddItem}
            disabled={!form.titulo || !form.grupo}
            className="bg-primary w-full rounded-lg py-2.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
          >
            Adicionar
          </button>
        </div>
      </Modal>

      {/* Modal grupo */}
      <Modal open={openGrupo} onClose={() => { setOpenGrupo(false); setEditGrupo(null); }} title={editGrupo ? "Editar Grupo" : "Novo Grupo"}>
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-text-muted mb-1 block text-xs font-medium">Nome do Grupo</label>
            <div className="flex gap-2">
              <input
                value={grupoForm}
                onChange={(e) => setGrupoForm(e.target.value)}
                className="w-full"
                placeholder="Ex: Documentos"
                onKeyDown={(e) => e.key === "Enter" && handleAddGrupo()}
              />
              <SpeechButton onResult={(t) => setGrupoForm(grupoForm + t)} />
            </div>
          </div>
          <button
            onClick={handleAddGrupo}
            disabled={!grupoForm.trim()}
            className="bg-primary w-full rounded-lg py-2.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
          >
            {editGrupo ? "Salvar" : "Adicionar"}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!removeGrupoTarget}
        onClose={() => setRemoveGrupoTarget(null)}
        onConfirm={handleRemoveGrupo}
        title="Remover grupo?"
        message={`Todos os itens do grupo "${removeGrupoTarget}" também serão removidos.`}
      />
    </div>
  );
}
