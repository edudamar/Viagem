import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type {
  Viagem,
  NovaViagemInput,
  Dia,
  Atividade,
  Lancamento,
  CategoriaFin,
  Subcategoria,
  Conta,
  FormaPagamento,
  Viajante,
  RegraImport,
  ChecklistItem,
} from "@/types";

export const PALETA = [
  "#fb923c",
  "#0d9488",
  "#fbbf24",
  "#e11d48",
  "#7c3aed",
  "#2563eb",
  "#16a34a",
  "#db2777",
  "#7c2d12",
  "#0891b2",
];

const uid = () => Math.random().toString(36).slice(2, 10);

function seed(): Viagem {
  const inicio = "2026-07-16";
  const dias: Dia[] = Array.from({ length: 8 }).map((_, i) => {
    const d = new Date(inicio + "T00:00:00");
    d.setDate(d.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    if (i === 0) {
      return {
        data: iso,
        atividades: [
          { id: `${i}-1`, hora: "09:00", titulo: "Café no Bairro Alto", local: "Pastelaria Alcôa", custo: 60, notas: "Pastel de Nata recém-saído do forno." },
          { id: `${i}-2`, hora: "11:30", titulo: "Caminhada Histórica", local: "Alfama & Castelo de S. Jorge", custo: 0, notas: "Ladeiras e miradouros." },
          { id: `${i}-3`, hora: "19:30", titulo: "Jantar de Fado", local: "Clube de Fado", custo: 320, notas: "Reserva para 2 pessoas." },
        ],
      };
    }
    if (i === 1) {
      return {
        data: iso,
        atividades: [
          { id: `${i}-1`, hora: "10:00", titulo: "Torre de Belém", local: "Belém", custo: 45 },
          { id: `${i}-2`, hora: "13:00", titulo: "Almoço em Belém", local: "Time Out Market", custo: 130 },
          { id: `${i}-3`, hora: "16:00", titulo: "Mosteiro dos Jerónimos", local: "Belém", custo: 70 },
        ],
      };
    }
    return {
      data: iso,
      atividades: [{ id: `${i}-1`, hora: "10:00", titulo: "Passeio livre", local: "Centro", custo: 90 }],
    };
  });

  const viajantes: Viajante[] = [
    { id: "v1", nome: "Você", cor: PALETA[0] },
    { id: "v2", nome: "Acompanhante", cor: PALETA[1] },
  ];

  const contas: Conta[] = [
    { id: "co1", nome: "Nubank", tipo: "Banco", cor: PALETA[4] },
    { id: "co2", nome: "Cartão Visa Internacional", tipo: "Cartão", cor: PALETA[5] },
    { id: "co3", nome: "Dinheiro", tipo: "Dinheiro", cor: PALETA[6] },
  ];

  const formasPagamento: FormaPagamento[] = [
    { id: "fp1", nome: "Crédito" },
    { id: "fp2", nome: "Débito" },
    { id: "fp3", nome: "Pix" },
    { id: "fp4", nome: "Dinheiro" },
    { id: "fp5", nome: "Transferência" },
  ];

  const categorias: CategoriaFin[] = [
    { id: "cat-hosp", nome: "Hospedagem", tipo: "despesa", cor: PALETA[0], subcategorias: [{ id: "sub-h1", nome: "Hotel" }, { id: "sub-h2", nome: "Airbnb" }, { id: "sub-h3", nome: "Hostel" }] },
    { id: "cat-trans", nome: "Transporte", tipo: "despesa", cor: PALETA[1], subcategorias: [{ id: "sub-t1", nome: "Passagem aérea" }, { id: "sub-t2", nome: "Uber / Táxi" }, { id: "sub-t3", nome: "Metrô / Ônibus" }, { id: "sub-t4", nome: "Aluguel de carro" }] },
    { id: "cat-alim", nome: "Alimentação", tipo: "despesa", cor: PALETA[2], subcategorias: [{ id: "sub-a1", nome: "Restaurante" }, { id: "sub-a2", nome: "Café" }, { id: "sub-a3", nome: "Mercado" }] },
    { id: "cat-lazer", nome: "Lazer", tipo: "despesa", cor: PALETA[3], subcategorias: [{ id: "sub-l1", nome: "Passeios" }, { id: "sub-l2", nome: "Museus" }, { id: "sub-l3", nome: "Ingressos" }] },
    { id: "cat-compras", nome: "Compras", tipo: "despesa", cor: PALETA[7], subcategorias: [{ id: "sub-c1", nome: "Lembranças" }, { id: "sub-c2", nome: "Roupas" }] },
    { id: "cat-saude", nome: "Saúde", tipo: "despesa", cor: PALETA[3], subcategorias: [{ id: "sub-s1", nome: "Farmácia" }, { id: "sub-s2", nome: "Seguro viagem" }] },
    { id: "cat-outros", nome: "Outros", tipo: "despesa", cor: PALETA[8], subcategorias: [{ id: "sub-o1", nome: "Diversos" }] },
    { id: "cat-rec-salario", nome: "Reserva pessoal", tipo: "receita", cor: PALETA[6], subcategorias: [{ id: "sub-r1", nome: "Poupança" }, { id: "sub-r2", nome: "Salário" }] },
    { id: "cat-rec-extra", nome: "Extras", tipo: "receita", cor: PALETA[9], subcategorias: [{ id: "sub-r3", nome: "Cashback" }, { id: "sub-r4", nome: "Reembolso" }] },
  ];

  const lancamentos: Lancamento[] = [
    { id: uid(), tipo: "despesa", data: "2026-06-01", valor: 2800, descricao: "Diárias do hotel (7 noites)", categoriaId: "cat-hosp", subcategoriaId: "sub-h1", contaId: "co2", formaPagamentoId: "fp1", viajantesIds: ["v1", "v2"] },
    { id: uid(), tipo: "despesa", data: "2026-06-10", valor: 1300, descricao: "Passagens aéreas GRU-LIS", categoriaId: "cat-trans", subcategoriaId: "sub-t1", contaId: "co1", formaPagamentoId: "fp3", viajantesIds: ["v1"] },
    { id: uid(), tipo: "despesa", data: "2026-07-01", valor: 220, descricao: "Seguro viagem", categoriaId: "cat-saude", subcategoriaId: "sub-s2", contaId: "co1", formaPagamentoId: "fp3", viajantesIds: ["v1", "v2"] },
    { id: uid(), tipo: "receita", data: "2026-05-15", valor: 5000, descricao: "Poupança da viagem", categoriaId: "cat-rec-salario", subcategoriaId: "sub-r1", contaId: "co1", formaPagamentoId: "fp5", viajantesIds: ["v1"] },
  ];

  return {
    id: "seed",
    destino: "Lisboa, Portugal",
    inicio,
    fim: "2026-07-23",
    orcamento: 12000,
    gastos: [],
    gruposChecklist: ["Documentos", "Bagagem", "Reservas"],
    checklist: [
      { id: "c1", grupo: "Documentos", titulo: "Validar Passaporte", done: true },
      { id: "c2", grupo: "Documentos", titulo: "Contratar Seguro Viagem", done: false, urgente: true },
      { id: "c3", grupo: "Documentos", titulo: "Imprimir reservas", done: false },
      { id: "c4", grupo: "Bagagem", titulo: "Adaptador de tomada", done: false },
      { id: "c5", grupo: "Bagagem", titulo: "Roupas de meia-estação", done: true },
      { id: "c6", grupo: "Bagagem", titulo: "Kit farmácia", done: false },
      { id: "c7", grupo: "Reservas", titulo: "Check-in do voo", done: false },
      { id: "c8", grupo: "Reservas", titulo: "Confirmar hotel", done: true },
    ],
    dias,
    viajantes,
    contas,
    formasPagamento,
    categorias,
    lancamentos,
    regrasImport: [],
  };
}

function ensureShape(v: Partial<Viagem> | null | undefined): Viagem {
  const base = seed();
  if (!v) return base;
  return {
    ...base,
    ...v,
    viajantes: v.viajantes ?? base.viajantes,
    contas: v.contas ?? base.contas,
    formasPagamento: v.formasPagamento ?? base.formasPagamento,
    categorias: v.categorias ?? base.categorias,
    lancamentos: v.lancamentos ?? [],
    regrasImport: v.regrasImport ?? [],
    checklist: v.checklist ?? base.checklist,
    gruposChecklist: v.gruposChecklist ?? base.gruposChecklist,
    dias: v.dias ?? base.dias,
    gastos: v.gastos ?? [],
  } as Viagem;
}

function novaViagemVazia(dados: NovaViagemInput, base: Viagem): Viagem {
  const start = new Date(dados.inicio + "T00:00:00");
  const end = new Date(dados.fim + "T00:00:00");
  const nDias = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
  const dias: Dia[] = Array.from({ length: nDias }).map((_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return { data: d.toISOString().slice(0, 10), atividades: [] };
  });
  return {
    id: uid(),
    destino: dados.destino,
    inicio: dados.inicio,
    fim: dados.fim,
    orcamento: dados.orcamento,
    gastos: [],
    checklist: [],
    gruposChecklist: [],
    dias,
    viajantes: base.viajantes,
    contas: base.contas,
    formasPagamento: base.formasPagamento,
    categorias: base.categorias,
    lancamentos: [],
    regrasImport: base.regrasImport,
  };
}

type Ctx = {
  viagem: Viagem;
  viagens: Viagem[];
  activeId: string;
  hydrated: boolean;
  setActiveViagem: (id: string) => void;
  criarViagem: (dados: NovaViagemInput) => string;
  duplicarViagem: (id: string) => string;
  removerViagem: (id: string) => void;
  importarViagem: (json: string) => boolean;
  importarViagemComo: (json: string, modo: "sobrescrever" | "copiar") => boolean;
  importarTodas: (json: string) => boolean;
  verificarViagemExiste: (destino: string) => Viagem | null;
  setViagem: (v: Viagem) => void;
  updateViagem: (patch: Partial<Pick<Viagem, "destino" | "inicio" | "fim" | "orcamento" | "capaUrl">>) => void;
  updateViagemById: (id: string, patch: Partial<Pick<Viagem, "destino" | "inicio" | "fim" | "orcamento" | "capaUrl">>) => void;
  toggleChecklist: (id: string) => void;
  addChecklistItem: (item: Omit<ChecklistItem, "id">) => void;
  removeChecklistItem: (id: string) => void;
  addGrupoChecklist: (nome: string) => void;
  updateGrupoChecklist: (oldNome: string, newNome: string) => void;
  removeGrupoChecklist: (nome: string) => void;
  addLancamento: (l: Omit<Lancamento, "id">) => string;
  addLancamentosEmLote: (items: Omit<Lancamento, "id">[]) => void;
  updateLancamento: (id: string, l: Partial<Lancamento>) => void;
  removeLancamento: (id: string) => void;
  addCategoria: (c: Omit<CategoriaFin, "id" | "subcategorias"> & { subcategorias?: Subcategoria[] }) => string;
  updateCategoria: (id: string, patch: Partial<CategoriaFin>) => void;
  removeCategoria: (id: string) => void;
  addSubcategoria: (categoriaId: string, nome: string) => string;
  updateSubcategoria: (categoriaId: string, subId: string, nome: string) => void;
  removeSubcategoria: (categoriaId: string, subId: string) => void;
  addConta: (c: Omit<Conta, "id">) => void;
  updateConta: (id: string, patch: Partial<Conta>) => void;
  removeConta: (id: string) => void;
  addFormaPagamento: (nome: string) => void;
  updateFormaPagamento: (id: string, nome: string) => void;
  removeFormaPagamento: (id: string) => void;
  addViajante: (v: Omit<Viajante, "id">) => string;
  updateViajante: (id: string, patch: Partial<Viajante>) => void;
  removeViajante: (id: string) => void;
  addRegraImport: (r: Omit<RegraImport, "id">) => void;
  updateRegraImport: (id: string, patch: Partial<Omit<RegraImport, "id">>) => void;
  removeRegraImport: (id: string) => void;
  updateDiaMemorial: (diaIndex: number, patch: Partial<Pick<Dia, "relato" | "destaque">>) => void;
  updateAtividadeMemorial: (
    diaIndex: number,
    atividadeId: string,
    patch: Partial<Pick<Atividade, "relato" | "nota" | "tags" | "endereco" | "coord" | "placeId" | "local" | "notas" | "titulo">>,
  ) => void;
  addAtividade: (diaIndex: number, a: Omit<Atividade, "id">) => void;
  updateAtividade: (diaIndex: number, atividadeId: string, patch: Partial<Atividade>) => void;
  removeAtividade: (diaIndex: number, atividadeId: string) => void;
  addFotoAtividade: (diaIndex: number, atividadeId: string, dataUrl: string) => void;
  removeFotoAtividade: (diaIndex: number, atividadeId: string, fotoIndex: number) => void;
};

const TripContext = createContext<Ctx | null>(null);
const STORAGE_KEY = "meu-roteiro-viagem-v2";
const STORAGE_KEY_MULTI = "meu-roteiro-viagens-v1";

export function TripProvider({ children }: { children: ReactNode }) {
  const [viagens, setViagens] = useState<Viagem[]>(() => [seed()]);
  const [activeId, setActiveId] = useState<string>(() => "seed");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const rawMulti = localStorage.getItem(STORAGE_KEY_MULTI);
      if (rawMulti) {
        const parsed = JSON.parse(rawMulti) as { viagens?: Partial<Viagem>[]; activeId?: string };
        const lista = (parsed.viagens ?? []).map((v) => ensureShape(v));
        if (lista.length > 0) {
          setViagens(lista);
          setActiveId(parsed.activeId && lista.some((v) => v.id === parsed.activeId) ? parsed.activeId : lista[0].id);
          setHydrated(true);
          return;
        }
      }
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const single = ensureShape(JSON.parse(raw) as Partial<Viagem>);
        if (!single.id || single.id === "seed") single.id = uid();
        setViagens([single]);
        setActiveId(single.id);
      }
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY_MULTI, JSON.stringify({ viagens, activeId }));
    } catch {}
  }, [viagens, activeId, hydrated]);

  const viagem = viagens.find((v) => v.id === activeId) ?? viagens[0];

  const setViagemState = (updater: Viagem | ((v: Viagem) => Viagem)) => {
    setViagens((list) =>
      list.map((v) =>
        v.id === activeId ? (typeof updater === "function" ? (updater as (v: Viagem) => Viagem)(v) : updater) : v,
      ),
    );
  };

  const value = useMemo<Ctx>(() => ({
    viagem,
    viagens,
    activeId,
    hydrated,
    setActiveViagem: (id) => setActiveId(id),
    criarViagem: (dados) => {
      const nova = novaViagemVazia(dados, viagem);
      setViagens((list) => [...list, nova]);
      setActiveId(nova.id);
      return nova.id;
    },
    duplicarViagem: (id) => {
      const alvo = viagens.find((v) => v.id === id);
      if (!alvo) return "";
      const copia: Viagem = { ...alvo, id: uid(), destino: `${alvo.destino} (cópia)` };
      setViagens((list) => [...list, copia]);
      setActiveId(copia.id);
      return copia.id;
    },
    removerViagem: (id) => {
      setViagens((list) => {
        const filtrada = list.filter((v) => v.id !== id);
        if (filtrada.length === 0) {
          setActiveId("");
          return [];
        }
        if (id === activeId) setActiveId(filtrada[0].id);
        return filtrada;
      });
    },
    importarViagem: (json) => {
      try {
        const dados = JSON.parse(json) as Partial<Viagem>;
        if (!dados.destino || !dados.inicio || !dados.fim) return false;
        const importada = ensureShape(dados);
        importada.id = uid();
        importada.dataImportacao = new Date().toISOString();
        if (!importada.destino.endsWith(" (importado)")) {
          importada.destino = importada.destino + " (importado)";
        }
        setViagens((list) => [...list, importada]);
        setActiveId(importada.id);
        return true;
      } catch {
        return false;
      }
    },
    importarTodas: (json) => {
      try {
        const dados = JSON.parse(json);
        if (!Array.isArray(dados)) return false;
        const now = new Date().toISOString();
        const importadas = dados
          .filter((d: Partial<Viagem>) => d.destino && d.inicio && d.fim)
          .map((d: Partial<Viagem>) => {
            const v = ensureShape(d);
            v.id = uid();
            v.dataImportacao = now;
            if (!v.destino.endsWith(" (importado)")) {
              v.destino = v.destino + " (importado)";
            }
            return v;
          });
        if (importadas.length === 0) return false;
        setViagens((list) => [...list, ...importadas]);
        setActiveId(importadas[0].id);
        return true;
      } catch {
        return false;
      }
    },
    verificarViagemExiste: (destino) => {
      const normalized = destino.replace(/ \(importado\)$/, "").trim().toLowerCase();
      return viagens.find((v) => v.destino.replace(/ \(importado\)$/, "").trim().toLowerCase() === normalized) ?? null;
    },
    importarViagemComo: (json, modo) => {
      try {
        const dados = JSON.parse(json) as Partial<Viagem>;
        if (!dados.destino || !dados.inicio || !dados.fim) return false;
        const importada = ensureShape(dados);
        importada.dataImportacao = new Date().toISOString();

        if (modo === "sobrescrever") {
          const existente = viagens.find((v) => v.destino.replace(/ \(importado\)$/, "").trim().toLowerCase() === importada.destino.replace(/ \(importado\)$/, "").trim().toLowerCase());
          if (existente) {
            importada.id = existente.id;
            setViagens((list) => list.map((v) => v.id === existente.id ? importada : v));
            setActiveId(importada.id);
            return true;
          }
        }

        importada.id = uid();
        if (!importada.destino.endsWith(" (importado)")) {
          importada.destino = importada.destino + " (copia)";
        }
        setViagens((list) => [...list, importada]);
        setActiveId(importada.id);
        return true;
      } catch {
        return false;
      }
    },
    setViagem: (v) => setViagemState(v),
    updateViagem: (patch) => setViagemState((v) => ({ ...v, ...patch })),
    updateViagemById: (id, patch) =>
      setViagens((list) => list.map((v) => (v.id === id ? { ...v, ...patch } : v))),
    toggleChecklist: (id) =>
      setViagemState((v) => ({
        ...v,
        checklist: v.checklist.map((c) => (c.id === id ? { ...c, done: !c.done } : c)),
      })),
    addChecklistItem: (item) =>
      setViagemState((v) => ({
        ...v,
        checklist: [...v.checklist, { ...item, id: uid() }],
      })),
    removeChecklistItem: (id) =>
      setViagemState((v) => ({
        ...v,
        checklist: v.checklist.filter((c) => c.id !== id),
      })),
    addGrupoChecklist: (nome) =>
      setViagemState((v) => ({
        ...v,
        gruposChecklist: v.gruposChecklist.includes(nome) ? v.gruposChecklist : [...v.gruposChecklist, nome],
      })),
    updateGrupoChecklist: (oldNome, newNome) =>
      setViagemState((v) => ({
        ...v,
        gruposChecklist: v.gruposChecklist.map((g) => (g === oldNome ? newNome : g)),
        checklist: v.checklist.map((c) => (c.grupo === oldNome ? { ...c, grupo: newNome } : c)),
      })),
    removeGrupoChecklist: (nome) =>
      setViagemState((v) => ({
        ...v,
        gruposChecklist: v.gruposChecklist.filter((g) => g !== nome),
        checklist: v.checklist.filter((c) => c.grupo !== nome),
      })),
    addLancamento: (l) => {
      const id = uid();
      setViagemState((v) => ({ ...v, lancamentos: [{ ...l, id }, ...v.lancamentos] }));
      return id;
    },
    addLancamentosEmLote: (items) =>
      setViagemState((v) => ({
        ...v,
        lancamentos: [...items.map((l) => ({ ...l, id: uid() })), ...v.lancamentos],
      })),
    updateLancamento: (id, patch) =>
      setViagemState((v) => ({
        ...v,
        lancamentos: v.lancamentos.map((l) => (l.id === id ? { ...l, ...patch } : l)),
      })),
    removeLancamento: (id) =>
      setViagemState((v) => ({ ...v, lancamentos: v.lancamentos.filter((l) => l.id !== id) })),
    addCategoria: (c) => {
      const id = uid();
      setViagemState((v) => ({
        ...v,
        categorias: [...v.categorias, { ...c, id, subcategorias: c.subcategorias ?? [] }],
      }));
      return id;
    },
    updateCategoria: (id, patch) =>
      setViagemState((v) => ({
        ...v,
        categorias: v.categorias.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      })),
    removeCategoria: (id) =>
      setViagemState((v) => ({ ...v, categorias: v.categorias.filter((c) => c.id !== id) })),
    addSubcategoria: (categoriaId, nome) => {
      const id = uid();
      setViagemState((v) => ({
        ...v,
        categorias: v.categorias.map((c) =>
          c.id === categoriaId ? { ...c, subcategorias: [...c.subcategorias, { id, nome }] } : c,
        ),
      }));
      return id;
    },
    removeSubcategoria: (categoriaId, subId) =>
      setViagemState((v) => ({
        ...v,
        categorias: v.categorias.map((c) =>
          c.id === categoriaId ? { ...c, subcategorias: c.subcategorias.filter((s) => s.id !== subId) } : c,
        ),
      })),
    updateSubcategoria: (categoriaId, subId, nome) =>
      setViagemState((v) => ({
        ...v,
        categorias: v.categorias.map((c) =>
          c.id === categoriaId
            ? { ...c, subcategorias: c.subcategorias.map((s) => (s.id === subId ? { ...s, nome } : s)) }
            : c,
        ),
      })),
    addConta: (c) => setViagemState((v) => ({ ...v, contas: [...v.contas, { ...c, id: uid() }] })),
    updateConta: (id, patch) =>
      setViagemState((v) => ({
        ...v,
        contas: v.contas.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      })),
    removeConta: (id) => setViagemState((v) => ({ ...v, contas: v.contas.filter((c) => c.id !== id) })),
    addFormaPagamento: (nome) =>
      setViagemState((v) => ({ ...v, formasPagamento: [...v.formasPagamento, { id: uid(), nome }] })),
    updateFormaPagamento: (id, nome) =>
      setViagemState((v) => ({
        ...v,
        formasPagamento: v.formasPagamento.map((f) => (f.id === id ? { ...f, nome } : f)),
      })),
    removeFormaPagamento: (id) =>
      setViagemState((v) => ({ ...v, formasPagamento: v.formasPagamento.filter((f) => f.id !== id) })),
    addViajante: (p) => {
      const id = uid();
      setViagemState((v) => ({ ...v, viajantes: [...v.viajantes, { ...p, id }] }));
      return id;
    },
    updateViajante: (id, patch) =>
      setViagemState((v) => ({
        ...v,
        viajantes: v.viajantes.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      })),
    removeViajante: (id) =>
      setViagemState((v) => ({ ...v, viajantes: v.viajantes.filter((p) => p.id !== id) })),
    addRegraImport: (r) =>
      setViagemState((v) => ({ ...v, regrasImport: [...v.regrasImport, { ...r, id: uid() }] })),
    updateRegraImport: (id, patch) =>
      setViagemState((v) => ({
        ...v,
        regrasImport: v.regrasImport.map((r) => (r.id === id ? { ...r, ...patch } : r)),
      })),
    removeRegraImport: (id) =>
      setViagemState((v) => ({ ...v, regrasImport: v.regrasImport.filter((r) => r.id !== id) })),
    updateDiaMemorial: (diaIndex, patch) =>
      setViagemState((v) => ({
        ...v,
        dias: v.dias.map((d, i) => (i === diaIndex ? { ...d, ...patch } : d)),
      })),
    updateAtividadeMemorial: (diaIndex, atividadeId, patch) =>
      setViagemState((v) => ({
        ...v,
        dias: v.dias.map((d, i) =>
          i === diaIndex
            ? { ...d, atividades: d.atividades.map((a) => (a.id === atividadeId ? { ...a, ...patch } : a)) }
            : d,
        ),
      })),
    addAtividade: (diaIndex, a) =>
      setViagemState((v) => ({
        ...v,
        dias: v.dias.map((d, i) =>
          i === diaIndex
            ? { ...d, atividades: [...d.atividades, { ...a, id: `${diaIndex}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}` }] }
            : d,
        ),
      })),
    updateAtividade: (diaIndex, atividadeId, patch) =>
      setViagemState((v) => ({
        ...v,
        dias: v.dias.map((d, i) =>
          i === diaIndex
            ? { ...d, atividades: d.atividades.map((a) => (a.id === atividadeId ? { ...a, ...patch } : a)) }
            : d,
        ),
      })),
    removeAtividade: (diaIndex, atividadeId) =>
      setViagemState((v) => ({
        ...v,
        dias: v.dias.map((d, i) =>
          i === diaIndex ? { ...d, atividades: d.atividades.filter((a) => a.id !== atividadeId) } : d,
        ),
      })),
    addFotoAtividade: (diaIndex, atividadeId, dataUrl) =>
      setViagemState((v) => ({
        ...v,
        dias: v.dias.map((d, i) =>
          i === diaIndex
            ? {
                ...d,
                atividades: d.atividades.map((a) =>
                  a.id === atividadeId ? { ...a, fotos: [...(a.fotos ?? []), dataUrl] } : a,
                ),
              }
            : d,
        ),
      })),
    removeFotoAtividade: (diaIndex, atividadeId, fotoIndex) =>
      setViagemState((v) => ({
        ...v,
        dias: v.dias.map((d, i) =>
          i === diaIndex
            ? {
                ...d,
                atividades: d.atividades.map((a) =>
                  a.id === atividadeId
                    ? { ...a, fotos: (a.fotos ?? []).filter((_, idx) => idx !== fotoIndex) }
                    : a,
                ),
              }
            : d,
        ),
      })),
  }), [viagem, viagens, activeId, hydrated]);

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export function useTrip() {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error("useTrip must be used within TripProvider");
  return ctx;
}
