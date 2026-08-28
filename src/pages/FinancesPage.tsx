import { useState, useMemo, useRef } from "react";
import { Plus, Filter, TrendingDown, TrendingUp, PlusCircle } from "lucide-react";
import { useTrip, PALETA } from "@/context/TripContext";
import { Header } from "@/components/Header";
import { ExpenseRow } from "@/components/ExpenseRow";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { fmtMoney, gastosPorCategoria, cn, limparNomeViagem } from "@/utils/helpers";
import { maskCurrency, parseCurrency, maskDate, parseDate, unmaskDate, blurCurrency, focusCurrency } from "@/utils/masks";
import { SpeechButton } from "@/components/SpeechButton";
import type { Lancamento, Conta, CategoriaFin } from "@/types";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

export default function FinancesPage() {
  const { viagem, addLancamento, updateLancamento, removeLancamento, addCategoria, addConta, addFormaPagamento, addSubcategoria } = useTrip();
  const descRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [editL, setEditL] = useState<Lancamento | null>(null);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [filterTipo, setFilterTipo] = useState<"todos" | "despesa" | "receita">("todos");
  const [valorStr, setValorStr] = useState("0");
  const [dataStr, setDataStr] = useState("");

  // Mini-modal states
  const [showCatModal, setShowCatModal] = useState(false);
  const [showContaModal, setShowContaModal] = useState(false);
  const [showFpModal, setShowFpModal] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);
  const [catForm, setCatForm] = useState({ nome: "", tipo: "despesa" as "despesa" | "receita", cor: PALETA[0] });
  const [contaForm, setContaForm] = useState({ nome: "", tipo: "Banco" as Conta["tipo"], cor: PALETA[0] });
  const [fpForm, setFpForm] = useState("");
  const [subForm, setSubForm] = useState("");

  const [form, setForm] = useState({
    tipo: "despesa" as "despesa" | "receita",
    descricao: "",
    categoriaId: "",
    subcategoriaId: "",
    contaId: viagem.contas[0]?.id ?? "",
    formaPagamentoId: viagem.formasPagamento[0]?.id ?? "",
    viajantesIds: [] as string[],
  });

  const categorias = useMemo(() => viagem.categorias.filter((c) => c.tipo === form.tipo), [viagem.categorias, form.tipo]);
  const filtered = useMemo(() => viagem.lancamentos.filter((l) => filterTipo === "todos" || l.tipo === filterTipo), [viagem.lancamentos, filterTipo]);
  const chartData = useMemo(() => gastosPorCategoria(viagem).map((x) => ({ nome: x.categoria.nome, total: x.total, cor: x.categoria.cor })), [viagem]);

  const resetForm = () => {
    setForm({ tipo: "despesa", descricao: "", categoriaId: "", subcategoriaId: "", contaId: viagem.contas[0]?.id ?? "", formaPagamentoId: viagem.formasPagamento[0]?.id ?? "", viajantesIds: [] as string[] });
    setValorStr("0");
    setDataStr(unmaskDate(new Date().toISOString().slice(0, 10)));
  };

  const openAdd = () => { resetForm(); setEditL(null); setOpen(true); setTimeout(() => descRef.current?.focus(), 100); };

  const openEdit = (l: Lancamento) => {
    setEditL(l);
    setForm({ tipo: l.tipo, descricao: l.descricao, categoriaId: l.categoriaId, subcategoriaId: l.subcategoriaId ?? "", contaId: l.contaId, formaPagamentoId: l.formaPagamentoId, viajantesIds: l.viajantesIds });
    setValorStr(maskCurrency(String(l.valor)));
    setDataStr(unmaskDate(l.data));
    setOpen(true);
    setTimeout(() => descRef.current?.focus(), 100);
  };

  const handleSave = () => {
    if (!form.descricao || parseCurrency(valorStr) <= 0) return;
    const data = { ...form, data: parseDate(dataStr), valor: parseCurrency(valorStr), subcategoriaId: form.subcategoriaId || undefined };
    if (editL) updateLancamento(editL.id, data); else addLancamento(data);
    setOpen(false);
  };

  const handleRemove = () => { if (removeId) { removeLancamento(removeId); setRemoveId(null); } };

  // Create new category and auto-select
  const handleCreateCat = () => {
    if (!catForm.nome) return;
    const id = addCategoria({ nome: catForm.nome, tipo: catForm.tipo, cor: catForm.cor });
    setForm({ ...form, categoriaId: id, subcategoriaId: "" });
    setShowCatModal(false);
    setCatForm({ nome: "", tipo: form.tipo, cor: PALETA[0] });
  };

  // Create new account and auto-select
  const handleCreateConta = () => {
    if (!contaForm.nome) return;
    addConta({ nome: contaForm.nome, tipo: contaForm.tipo, cor: contaForm.cor });
    const newConta = viagem.contas[viagem.contas.length - 1];
    if (newConta) setForm({ ...form, contaId: newConta.id });
    setShowContaModal(false);
    setContaForm({ nome: "", tipo: "Banco", cor: PALETA[0] });
  };

  // Create new payment method and auto-select
  const handleCreateFp = () => {
    if (!fpForm) return;
    addFormaPagamento(fpForm);
    const newFp = viagem.formasPagamento[viagem.formasPagamento.length - 1];
    if (newFp) setForm({ ...form, formaPagamentoId: newFp.id });
    setShowFpModal(false);
    setFpForm("");
  };

  // Create new subcategory and auto-select
  const handleCreateSub = () => {
    if (!subForm || !form.categoriaId) return;
    const id = addSubcategoria(form.categoriaId, subForm);
    setForm({ ...form, subcategoriaId: id });
    setShowSubModal(false);
    setSubForm("");
  };

  const totalDespesas = filtered.filter((l) => l.tipo === "despesa").reduce((s, l) => s + l.valor, 0);
  const totalReceitas = filtered.filter((l) => l.tipo === "receita").reduce((s, l) => s + l.valor, 0);

  return (
    <div>
      <Header title="Finanças" subtitle={limparNomeViagem(viagem.destino)} actions={<button onClick={openAdd} className="bg-primary flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-white"><Plus className="h-3.5 w-3.5" /> Novo</button>} />
      <div className="mx-auto max-w-4xl space-y-4 p-4 md:px-6">
        <div className="flex gap-2">
          {(["todos", "despesa", "receita"] as const).map((t) => (
            <button key={t} onClick={() => setFilterTipo(t)} className={cn("rounded-full px-3 py-1.5 text-xs font-medium transition-colors", filterTipo === t ? "bg-primary text-white" : "bg-surface border border-border text-text-muted")}>
              {t === "todos" ? "Todos" : t === "despesa" ? "Despesas" : "Receitas"}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface rounded-xl border border-border p-4">
            <div className="text-text-muted flex items-center gap-1 text-xs"><TrendingDown className="h-3.5 w-3.5" /> Despesas</div>
            <div className="mt-1 text-lg font-bold text-red-500">{fmtMoney(totalDespesas)}</div>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4">
            <div className="text-text-muted flex items-center gap-1 text-xs"><TrendingUp className="h-3.5 w-3.5" /> Receitas</div>
            <div className="mt-1 text-lg font-bold text-green-600">{fmtMoney(totalReceitas)}</div>
          </div>
        </div>

        {chartData.length > 0 && (
          <div className="bg-surface rounded-xl border border-border p-4">
            <h3 className="mb-3 text-sm font-medium">Gastos por Categoria</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <XAxis dataKey="nome" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => fmtMoney(v)} />
                <Bar dataKey="total" radius={[6, 6, 0, 0]}>{chartData.map((entry, i) => <Cell key={i} fill={entry.cor} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="space-y-2">
          {filtered.length === 0 ? (
            <EmptyState icon={<Filter className="h-12 w-12" />} title="Sem lançamentos" description="Adicione seus primeiros gastos ou receitas" />
          ) : (
            filtered.map((l) => <ExpenseRow key={l.id} lancamento={l} categoria={viagem.categorias.find((c) => c.id === l.categoriaId)} onEdit={() => openEdit(l)} onRemove={() => setRemoveId(l.id)} />)
          )}
        </div>
      </div>

      {/* Modal Lançamento */}
      <Modal open={open} onClose={() => setOpen(false)} title={editL ? "Editar Lançamento" : "Novo Lançamento"}>
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <button onClick={() => setForm({ ...form, tipo: "despesa", categoriaId: "" })} className={cn("flex-1 rounded-lg py-2 text-sm font-medium transition-colors", form.tipo === "despesa" ? "bg-red-500 text-white" : "bg-gray-100")}>Despesa</button>
            <button onClick={() => setForm({ ...form, tipo: "receita", categoriaId: "" })} className={cn("flex-1 rounded-lg py-2 text-sm font-medium transition-colors", form.tipo === "receita" ? "bg-green-500 text-white" : "bg-gray-100")}>Receita</button>
          </div>
          <div>
            <label className="text-text-muted mb-1 block text-xs font-medium">Descrição</label>
            <div className="flex gap-2">
              <input ref={descRef} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} className="w-full" placeholder="Ex: Passagem aérea" />
              <SpeechButton onResult={(t) => setForm({ ...form, descricao: form.descricao + t })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-text-muted mb-1 block text-xs font-medium">Valor (R$)</label>
              <input value={valorStr} onChange={(e) => setValorStr(maskCurrency(e.target.value))} onBlur={(e) => setValorStr(blurCurrency(e.target.value))} onFocus={focusCurrency} className="w-full" placeholder="0" />
            </div>
            <div>
              <label className="text-text-muted mb-1 block text-xs font-medium">Data</label>
              <input value={dataStr} onChange={(e) => setDataStr(maskDate(e.target.value))} placeholder="dd/mm/aaaa" maxLength={10} className="w-full" />
            </div>
          </div>

          {/* Categoria com botão + */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-text-muted text-xs font-medium">Categoria</label>
              <button onClick={() => { setCatForm({ nome: "", tipo: form.tipo, cor: PALETA[0] }); setShowCatModal(true); }} className="text-primary flex items-center gap-0.5 text-xs font-medium hover:underline">
                <PlusCircle className="h-3 w-3" /> Novo
              </button>
            </div>
            <select value={form.categoriaId} onChange={(e) => setForm({ ...form, categoriaId: e.target.value })} className="w-full">
              <option value="">Selecione</option>
              {categorias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>

          {form.categoriaId && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-text-muted text-xs font-medium">Subcategoria</label>
                <button onClick={() => { setSubForm(""); setShowSubModal(true); }} className="text-primary flex items-center gap-0.5 text-xs font-medium hover:underline">
                  <PlusCircle className="h-3 w-3" /> Novo
                </button>
              </div>
              <select value={form.subcategoriaId} onChange={(e) => setForm({ ...form, subcategoriaId: e.target.value })} className="w-full">
                <option value="">Nenhuma</option>
                {categorias.find((c) => c.id === form.categoriaId)?.subcategorias.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
              </select>
            </div>
          )}

          {/* Conta e Forma de Pagamento com botões + */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-text-muted text-xs font-medium">Conta</label>
                <button onClick={() => { setContaForm({ nome: "", tipo: "Banco", cor: PALETA[0] }); setShowContaModal(true); }} className="text-primary flex items-center gap-0.5 text-xs font-medium hover:underline">
                  <PlusCircle className="h-3 w-3" /> Novo
                </button>
              </div>
              <select value={form.contaId} onChange={(e) => setForm({ ...form, contaId: e.target.value })} className="w-full">
                {viagem.contas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-text-muted text-xs font-medium">Forma Pgto</label>
                <button onClick={() => { setFpForm(""); setShowFpModal(true); }} className="text-primary flex items-center gap-0.5 text-xs font-medium hover:underline">
                  <PlusCircle className="h-3 w-3" /> Novo
                </button>
              </div>
              <select value={form.formaPagamentoId} onChange={(e) => setForm({ ...form, formaPagamentoId: e.target.value })} className="w-full">
                {viagem.formasPagamento.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-text-muted mb-1 block text-xs font-medium">Viajantes</label>
            <div className="flex flex-wrap gap-2">
              {viagem.viajantes.map((v) => (
                <button key={v.id} onClick={() => setForm({ ...form, viajantesIds: form.viajantesIds.includes(v.id) ? form.viajantesIds.filter((x) => x !== v.id) : [...form.viajantesIds, v.id] })}
                  className={cn("rounded-full px-3 py-1 text-xs font-medium transition-colors", form.viajantesIds.includes(v.id) ? "text-white" : "bg-gray-100 text-text-muted")}
                  style={form.viajantesIds.includes(v.id) ? { backgroundColor: v.cor } : {}}>{v.nome}</button>
              ))}
            </div>
          </div>
          <button onClick={handleSave} disabled={!form.descricao || parseCurrency(valorStr) <= 0} className="bg-primary w-full rounded-lg py-2.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50">
            {editL ? "Salvar" : "Adicionar"}
          </button>
        </div>
      </Modal>

      {/* Mini-modal Nova Categoria */}
      <Modal open={showCatModal} onClose={() => setShowCatModal(false)} title="Nova Categoria">
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-text-muted mb-1 block text-xs font-medium">Nome</label>
            <div className="flex gap-2">
              <input value={catForm.nome} onChange={(e) => setCatForm({ ...catForm, nome: e.target.value })} className="w-full" placeholder="Ex: Alimentação" autoFocus />
              <SpeechButton onResult={(t) => setCatForm({ ...catForm, nome: catForm.nome + t })} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setCatForm({ ...catForm, tipo: "despesa" })} className={cn("flex-1 rounded-lg py-2 text-xs font-medium", catForm.tipo === "despesa" ? "bg-red-500 text-white" : "bg-gray-100")}>Despesa</button>
            <button onClick={() => setCatForm({ ...catForm, tipo: "receita" })} className={cn("flex-1 rounded-lg py-2 text-xs font-medium", catForm.tipo === "receita" ? "bg-green-500 text-white" : "bg-gray-100")}>Receita</button>
          </div>
          <div>
            <label className="text-text-muted mb-1 block text-xs font-medium">Cor</label>
            <div className="flex flex-wrap gap-2">
              {PALETA.map((c) => <button key={c} onClick={() => setCatForm({ ...catForm, cor: c })} className={cn("h-7 w-7 rounded-full transition-transform", catForm.cor === c && "ring-2 ring-offset-2 ring-primary scale-110")} style={{ backgroundColor: c }} />)}
            </div>
          </div>
          <button onClick={handleCreateCat} disabled={!catForm.nome} className="bg-primary w-full rounded-lg py-2.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50">Salvar</button>
        </div>
      </Modal>

      {/* Mini-modal Nova Conta */}
      <Modal open={showContaModal} onClose={() => setShowContaModal(false)} title="Nova Conta">
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-text-muted mb-1 block text-xs font-medium">Nome</label>
            <div className="flex gap-2">
              <input value={contaForm.nome} onChange={(e) => setContaForm({ ...contaForm, nome: e.target.value })} className="w-full" placeholder="Ex: Nubank" autoFocus />
              <SpeechButton onResult={(t) => setContaForm({ ...contaForm, nome: contaForm.nome + t })} />
            </div>
          </div>
          <div>
            <label className="text-text-muted mb-1 block text-xs font-medium">Tipo</label>
            <select value={contaForm.tipo} onChange={(e) => setContaForm({ ...contaForm, tipo: e.target.value as Conta["tipo"] })} className="w-full">
              {["Banco", "Cartão", "Dinheiro", "Pix", "Carteira"].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-text-muted mb-1 block text-xs font-medium">Cor</label>
            <div className="flex flex-wrap gap-2">
              {PALETA.map((c) => <button key={c} onClick={() => setContaForm({ ...contaForm, cor: c })} className={cn("h-7 w-7 rounded-full transition-transform", contaForm.cor === c && "ring-2 ring-offset-2 ring-primary scale-110")} style={{ backgroundColor: c }} />)}
            </div>
          </div>
          <button onClick={handleCreateConta} disabled={!contaForm.nome} className="bg-primary w-full rounded-lg py-2.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50">Salvar</button>
        </div>
      </Modal>

      {/* Mini-modal Nova Forma de Pagamento */}
      <Modal open={showFpModal} onClose={() => setShowFpModal(false)} title="Nova Forma de Pagamento">
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-text-muted mb-1 block text-xs font-medium">Nome</label>
            <div className="flex gap-2">
              <input value={fpForm} onChange={(e) => setFpForm(e.target.value)} className="w-full" placeholder="Ex: Pix" autoFocus />
              <SpeechButton onResult={(t) => setFpForm(fpForm + t)} />
            </div>
          </div>
          <button onClick={handleCreateFp} disabled={!fpForm} className="bg-primary w-full rounded-lg py-2.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50">Salvar</button>
        </div>
      </Modal>

      {/* Mini-modal Nova Subcategoria */}
      <Modal open={showSubModal} onClose={() => setShowSubModal(false)} title="Nova Subcategoria">
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-text-muted mb-1 block text-xs font-medium">Nome</label>
            <div className="flex gap-2">
              <input value={subForm} onChange={(e) => setSubForm(e.target.value)} className="w-full" placeholder="Ex: Restaurante" autoFocus />
              <SpeechButton onResult={(t) => setSubForm(subForm + t)} />
            </div>
          </div>
          <button onClick={handleCreateSub} disabled={!subForm} className="bg-primary w-full rounded-lg py-2.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50">Salvar</button>
        </div>
      </Modal>

      <ConfirmDialog open={!!removeId} onClose={() => setRemoveId(null)} onConfirm={handleRemove} title="Remover lançamento?" message="Esta ação não pode ser desfeita." />
    </div>
  );
}
