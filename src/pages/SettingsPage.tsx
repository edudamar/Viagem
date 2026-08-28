import { useState, useRef } from "react";
import { Plus, Trash2, Users, CreditCard, Tag, Wallet, Pencil } from "lucide-react";
import { useTrip, PALETA } from "@/context/TripContext";
import { Header } from "@/components/Header";
import { Modal } from "@/components/Modal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { cn } from "@/utils/helpers";
import { SpeechButton } from "@/components/SpeechButton";
import type { CategoriaFin, Conta, FormaPagamento, Viajante } from "@/types";

type Section = "categorias" | "contas" | "formas" | "viajantes";

export default function SettingsPage() {
  const { viagem, addCategoria, updateCategoria, removeCategoria, addSubcategoria, updateSubcategoria, removeSubcategoria, addConta, updateConta, removeConta, addFormaPagamento, updateFormaPagamento, removeFormaPagamento, addViajante, updateViajante, removeViajante } = useTrip();
  const nomeRef = useRef<HTMLInputElement>(null);
  const [section, setSection] = useState<Section>("categorias");
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<{ type: string; id: string; data: unknown } | null>(null);
  const [removeTarget, setRemoveTarget] = useState<{ type: string; id: string } | null>(null);
  const [catForm, setCatForm] = useState({ nome: "", tipo: "despesa" as "despesa" | "receita", cor: PALETA[0] });
  const [subForm, setSubForm] = useState({ catId: "", nome: "" });
  const [contaForm, setContaForm] = useState({ nome: "", tipo: "Banco" as Conta["tipo"], cor: PALETA[0] });
  const [fpForm, setFpForm] = useState({ nome: "" });
  const [viajForm, setViajForm] = useState({ nome: "", cor: PALETA[0] });

  const openModal = (sec: Section) => {
    setSection(sec);
    setCatForm({ nome: "", tipo: "despesa", cor: PALETA[0] });
    setContaForm({ nome: "", tipo: "Banco", cor: PALETA[0] });
    setFpForm({ nome: "" });
    setViajForm({ nome: "", cor: PALETA[0] });
    setOpen(true);
    setTimeout(() => nomeRef.current?.focus(), 100);
  };

  const openEdit = (type: string, item: CategoriaFin | Conta | FormaPagamento | Viajante) => {
    if (type === "categoria") {
      const c = item as CategoriaFin;
      setCatForm({ nome: c.nome, tipo: c.tipo, cor: c.cor });
    } else if (type === "conta") {
      const c = item as Conta;
      setContaForm({ nome: c.nome, tipo: c.tipo, cor: c.cor });
    } else if (type === "forma") {
      const f = item as FormaPagamento;
      setFpForm({ nome: f.nome });
    } else if (type === "viajante") {
      const v = item as Viajante;
      setViajForm({ nome: v.nome, cor: v.cor });
    }
    setEditItem({ type, id: item.id, data: item });
    setOpen(true);
    setTimeout(() => nomeRef.current?.focus(), 100);
  };

  const openEditSub = (catId: string, sub: { id: string; nome: string }) => {
    setSubForm({ catId, nome: sub.nome });
    setEditItem({ type: "sub", id: sub.id, data: { catId, subId: sub.id } });
    setOpen(true);
    setTimeout(() => nomeRef.current?.focus(), 100);
  };

  const handleAdd = () => {
    if (editItem) {
      handleUpdate();
      return;
    }
    if (section === "categorias" && catForm.nome) { addCategoria({ nome: catForm.nome, tipo: catForm.tipo, cor: catForm.cor }); }
    else if (section === "contas" && contaForm.nome) { addConta({ nome: contaForm.nome, tipo: contaForm.tipo, cor: contaForm.cor }); }
    else if (section === "formas" && fpForm.nome) { addFormaPagamento(fpForm.nome); }
    else if (section === "viajantes" && viajForm.nome) { addViajante({ nome: viajForm.nome, cor: viajForm.cor }); }
    setOpen(false);
    setEditItem(null);
  };

  const handleUpdate = () => {
    if (!editItem) return;
    const { type, id } = editItem;
    if (type === "categoria" && catForm.nome) { updateCategoria(id, { nome: catForm.nome, tipo: catForm.tipo, cor: catForm.cor }); }
    else if (type === "conta" && contaForm.nome) { updateConta(id, { nome: contaForm.nome, tipo: contaForm.tipo, cor: contaForm.cor }); }
    else if (type === "forma" && fpForm.nome) { updateFormaPagamento(id, fpForm.nome); }
    else if (type === "viajante" && viajForm.nome) { updateViajante(id, { nome: viajForm.nome, cor: viajForm.cor }); }
    else if (type === "sub" && subForm.nome) { const data = editItem.data as { catId: string; subId: string }; updateSubcategoria(data.catId, data.subId, subForm.nome); }
    setOpen(false);
    setEditItem(null);
  };

  const handleRemove = () => {
    if (!removeTarget) return;
    const { type, id } = removeTarget;
    if (type === "categoria") removeCategoria(id);
    else if (type === "conta") removeConta(id);
    else if (type === "forma") removeFormaPagamento(id);
    else if (type === "viajante") removeViajante(id);
    else if (type === "sub") { const [catId] = id.split("|"); removeSubcategoria(catId, id); }
    setRemoveTarget(null);
  };

  const sections: { key: Section; label: string; icon: React.ReactNode }[] = [
    { key: "categorias", label: "Categorias", icon: <Tag className="h-4 w-4" /> },
    { key: "contas", label: "Contas", icon: <Wallet className="h-4 w-4" /> },
    { key: "formas", label: "Formas Pgto", icon: <CreditCard className="h-4 w-4" /> },
    { key: "viajantes", label: "Viajantes", icon: <Users className="h-4 w-4" /> },
  ];

  return (
    <div>
      <Header title="Configurações" />
      <div className="mx-auto max-w-4xl p-4 md:px-6">
        <div className="bg-surface mb-4 overflow-x-auto rounded-xl border border-border p-1">
          <div className="flex gap-1">
            {sections.map((s) => (
              <button key={s.key} onClick={() => setSection(s.key)} className={cn("flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors", section === s.key ? "bg-primary text-white" : "text-text-muted hover:bg-gray-50")}>
                {s.icon} {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {section === "categorias" && (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Categorias ({viagem.categorias.length})</h3>
                <button onClick={() => openModal("categorias")} className="bg-primary flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-white"><Plus className="h-3.5 w-3.5" /> Nova</button>
              </div>
              {viagem.categorias.map((cat) => (
                <div key={cat.id} className="bg-surface rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 cursor-pointer flex-1 min-w-0" onClick={() => openEdit("categoria", cat)}>
                      <div className="h-4 w-4 rounded-full shrink-0" style={{ backgroundColor: cat.cor }} />
                      <div className="min-w-0"><span className="text-sm font-medium">{cat.nome}</span><span className="text-text-muted ml-2 text-xs">({cat.tipo})</span></div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => openEdit("categoria", cat)} className="text-text-muted hover:text-primary p-1"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => setRemoveTarget({ type: "categoria", id: cat.id })} className="text-text-muted hover:text-red-500 p-1"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                  {cat.subcategorias.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5 pl-7">{cat.subcategorias.map((sub) => <span key={sub.id} className="bg-gray-100 flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] cursor-pointer hover:bg-gray-200" onClick={() => openEditSub(cat.id, sub)}>{sub.nome}<button onClick={(e) => { e.stopPropagation(); setRemoveTarget({ type: "sub", id: `${cat.id}|${sub.id}` }); }} className="text-text-muted hover:text-red-500">&times;</button></span>)}</div>}
                  <div className="mt-2 pl-7 flex items-center gap-1">
                    <input value={subForm.catId === cat.id ? subForm.nome : ""} onChange={(e) => setSubForm({ catId: cat.id, nome: e.target.value })} onFocus={() => setSubForm({ ...subForm, catId: cat.id })} onKeyDown={(e) => { if (e.key === "Enter" && subForm.nome && subForm.catId === cat.id) { addSubcategoria(cat.id, subForm.nome); setSubForm({ catId: "", nome: "" }); } }} placeholder="+ Subcategoria" className="w-full rounded-full border-0 bg-transparent px-2 py-1 text-xs outline-none placeholder:text-gray-300" />
                    {subForm.catId === cat.id && <SpeechButton onResult={(t) => setSubForm({ ...subForm, nome: subForm.nome + t })} className="h-6 w-6" />}
                  </div>
                </div>
              ))}
            </>
          )}
          {section === "contas" && (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Contas ({viagem.contas.length})</h3>
                <button onClick={() => openModal("contas")} className="bg-primary flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-white"><Plus className="h-3.5 w-3.5" /> Nova</button>
              </div>
              {viagem.contas.map((conta) => (
                <div key={conta.id} className="bg-surface flex items-center justify-between rounded-xl border border-border p-4">
                  <div className="flex items-center gap-3 cursor-pointer flex-1 min-w-0" onClick={() => openEdit("conta", conta)}>
                    <div className="h-4 w-4 rounded-full shrink-0" style={{ backgroundColor: conta.cor }} />
                    <div className="min-w-0"><span className="text-sm font-medium">{conta.nome}</span><span className="text-text-muted ml-2 text-xs">({conta.tipo})</span></div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openEdit("conta", conta)} className="text-text-muted hover:text-primary p-1"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => setRemoveTarget({ type: "conta", id: conta.id })} className="text-text-muted hover:text-red-500 p-1"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </>
          )}
          {section === "formas" && (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Formas de Pagamento ({viagem.formasPagamento.length})</h3>
                <button onClick={() => openModal("formas")} className="bg-primary flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-white"><Plus className="h-3.5 w-3.5" /> Nova</button>
              </div>
              {viagem.formasPagamento.map((fp) => (
                <div key={fp.id} className="bg-surface flex items-center justify-between rounded-xl border border-border p-4">
                  <span className="text-sm font-medium cursor-pointer flex-1 min-w-0" onClick={() => openEdit("forma", fp)}>{fp.nome}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openEdit("forma", fp)} className="text-text-muted hover:text-primary p-1"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => setRemoveTarget({ type: "forma", id: fp.id })} className="text-text-muted hover:text-red-500 p-1"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </>
          )}
          {section === "viajantes" && (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Viajantes ({viagem.viajantes.length})</h3>
                <button onClick={() => openModal("viajantes")} className="bg-primary flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-white"><Plus className="h-3.5 w-3.5" /> Novo</button>
              </div>
              {viagem.viajantes.map((v) => (
                <div key={v.id} className="bg-surface flex items-center justify-between rounded-xl border border-border p-4">
                  <div className="flex items-center gap-3 cursor-pointer flex-1 min-w-0" onClick={() => openEdit("viajante", v)}>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white shrink-0" style={{ backgroundColor: v.cor }}>{v.nome[0]?.toUpperCase()}</div>
                    <span className="text-sm font-medium">{v.nome}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openEdit("viajante", v)} className="text-text-muted hover:text-primary p-1"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => setRemoveTarget({ type: "viajante", id: v.id })} className="text-text-muted hover:text-red-500 p-1"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      <Modal open={open} onClose={() => { setOpen(false); setEditItem(null); }} title={editItem ? "Editar" : section === "categorias" ? "Nova Categoria" : section === "contas" ? "Nova Conta" : section === "formas" ? "Nova Forma de Pagamento" : "Novo Viajante"}>
        <div className="flex flex-col gap-3">
          {section === "categorias" && (
            <>
              <div><label className="text-text-muted mb-1 block text-xs font-medium">Nome</label><div className="flex gap-2"><input ref={nomeRef} value={catForm.nome} onChange={(e) => setCatForm({ ...catForm, nome: e.target.value })} className="w-full" placeholder="Ex: Alimentação" /><SpeechButton onResult={(t) => setCatForm({ ...catForm, nome: catForm.nome + t })} /></div></div>
              <div className="flex gap-2">
                <button onClick={() => setCatForm({ ...catForm, tipo: "despesa" })} className={cn("flex-1 rounded-lg py-2 text-xs font-medium", catForm.tipo === "despesa" ? "bg-red-500 text-white" : "bg-gray-100")}>Despesa</button>
                <button onClick={() => setCatForm({ ...catForm, tipo: "receita" })} className={cn("flex-1 rounded-lg py-2 text-xs font-medium", catForm.tipo === "receita" ? "bg-green-500 text-white" : "bg-gray-100")}>Receita</button>
              </div>
              <div><label className="text-text-muted mb-1 block text-xs font-medium">Cor</label><div className="flex flex-wrap gap-2">{PALETA.map((c) => <button key={c} onClick={() => setCatForm({ ...catForm, cor: c })} className={cn("h-7 w-7 rounded-full transition-transform", catForm.cor === c && "ring-2 ring-offset-2 ring-primary scale-110")} style={{ backgroundColor: c }} />)}</div></div>
            </>
          )}
          {section === "contas" && (
            <>
              <div><label className="text-text-muted mb-1 block text-xs font-medium">Nome</label><div className="flex gap-2"><input ref={nomeRef} value={contaForm.nome} onChange={(e) => setContaForm({ ...contaForm, nome: e.target.value })} className="w-full" placeholder="Ex: Nubank" /><SpeechButton onResult={(t) => setContaForm({ ...contaForm, nome: contaForm.nome + t })} /></div></div>
              <div><label className="text-text-muted mb-1 block text-xs font-medium">Tipo</label><select value={contaForm.tipo} onChange={(e) => setContaForm({ ...contaForm, tipo: e.target.value as Conta["tipo"] })} className="w-full">{["Banco", "Cartão", "Dinheiro", "Pix", "Carteira"].map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><label className="text-text-muted mb-1 block text-xs font-medium">Cor</label><div className="flex flex-wrap gap-2">{PALETA.map((c) => <button key={c} onClick={() => setContaForm({ ...contaForm, cor: c })} className={cn("h-7 w-7 rounded-full transition-transform", contaForm.cor === c && "ring-2 ring-offset-2 ring-primary scale-110")} style={{ backgroundColor: c }} />)}</div></div>
            </>
          )}
          {section === "formas" && <div><label className="text-text-muted mb-1 block text-xs font-medium">Nome</label><div className="flex gap-2"><input ref={nomeRef} value={fpForm.nome} onChange={(e) => setFpForm({ ...fpForm, nome: e.target.value })} className="w-full" placeholder="Ex: Pix" /><SpeechButton onResult={(t) => setFpForm({ ...fpForm, nome: fpForm.nome + t })} /></div></div>}
          {section === "viajantes" && (
            <>
              <div><label className="text-text-muted mb-1 block text-xs font-medium">Nome</label><div className="flex gap-2"><input ref={nomeRef} value={viajForm.nome} onChange={(e) => setViajForm({ ...viajForm, nome: e.target.value })} className="w-full" placeholder="Ex: João" /><SpeechButton onResult={(t) => setViajForm({ ...viajForm, nome: viajForm.nome + t })} /></div></div>
              <div><label className="text-text-muted mb-1 block text-xs font-medium">Cor</label><div className="flex flex-wrap gap-2">{PALETA.map((c) => <button key={c} onClick={() => setViajForm({ ...viajForm, cor: c })} className={cn("h-7 w-7 rounded-full transition-transform", viajForm.cor === c && "ring-2 ring-offset-2 ring-primary scale-110")} style={{ backgroundColor: c }} />)}</div></div>
            </>
          )}
          <button onClick={handleAdd} className="bg-primary w-full rounded-lg py-2.5 text-sm font-medium text-white hover:bg-primary-dark">{editItem ? "Salvar" : "Adicionar"}</button>
        </div>
      </Modal>
      <ConfirmDialog open={!!removeTarget} onClose={() => setRemoveTarget(null)} onConfirm={handleRemove} title="Remover item?" message="Esta ação não pode ser desfeita." />
    </div>
  );
}
