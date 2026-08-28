import type { Viagem, Lancamento, Divisao, CategoriaFin } from "@/types";

export function diasAte(iso: string): number {
  if (typeof window === "undefined") return 0;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const alvo = new Date(iso + "T00:00:00");
  alvo.setHours(0, 0, 0, 0);
  return Math.round((alvo.getTime() - hoje.getTime()) / 86400000);
}

export function totalGasto(v: Viagem): number {
  return v.lancamentos.filter((l) => l.tipo === "despesa").reduce((s, l) => s + l.valor, 0);
}

export function totalReceita(v: Viagem): number {
  return v.lancamentos.filter((l) => l.tipo === "receita").reduce((s, l) => s + l.valor, 0);
}

export function saldo(v: Viagem): number {
  return totalReceita(v) - totalGasto(v);
}

export function gastosPorCategoria(v: Viagem): Array<{ categoria: CategoriaFin; total: number }> {
  return v.categorias
    .filter((c) => c.tipo === "despesa")
    .map((c) => ({
      categoria: c,
      total: v.lancamentos
        .filter((l) => l.tipo === "despesa" && l.categoriaId === c.id)
        .reduce((s, l) => s + l.valor, 0),
    }))
    .filter((x) => x.total > 0);
}

export function fmtMoney(n: number): string {
  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function fmtMoneyShort(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return fmtMoney(n);
}

export function fmtDataCurta(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function fmtData(iso: string): string {
  if (!iso || iso.length < 10) return iso;
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function fmtDataLonga(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

export function nomeDiaSemana(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
}

export function nomeDiaSemanaCompleto(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { weekday: "long" });
}

export function iniciaisDe(nome: string): string {
  return nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function calcularDivisao(
  valor: number,
  viajantesIds: string[],
  divisao?: Divisao,
): { viajanteId: string; valor: number }[] {
  if (viajantesIds.length === 0) return [];
  const modo = divisao?.modo ?? "igual";
  const partesInput = divisao?.partes ?? [];

  const pesos = viajantesIds.map((id) => {
    const p = partesInput.find((x) => x.viajanteId === id);
    return { viajanteId: id, peso: p?.peso ?? 0 };
  });

  let brutos: number[];
  if (modo === "igual" || pesos.every((p) => p.peso === 0)) {
    const q = valor / viajantesIds.length;
    brutos = viajantesIds.map(() => q);
  } else if (modo === "valor") {
    brutos = pesos.map((p) => p.peso);
  } else if (modo === "porcentagem") {
    brutos = pesos.map((p) => (valor * p.peso) / 100);
  } else {
    const soma = pesos.reduce((s, p) => s + p.peso, 0) || 1;
    brutos = pesos.map((p) => (valor * p.peso) / soma);
  }

  const arred = brutos.map(round2);
  const diff = round2(valor - arred.reduce((s, v) => s + v, 0));
  if (arred.length > 0) arred[arred.length - 1] = round2(arred[arred.length - 1] + diff);

  return viajantesIds.map((id, i) => ({ viajanteId: id, valor: arred[i] }));
}

export function totalRepartido(
  divisao: Divisao | undefined,
  valor: number,
  viajantesIds: string[],
): number {
  if (!divisao || divisao.modo === "igual") return valor;
  const partes = divisao.partes.filter((p) => viajantesIds.includes(p.viajanteId));
  if (divisao.modo === "valor") return round2(partes.reduce((s, p) => s + p.peso, 0));
  if (divisao.modo === "porcentagem")
    return round2((valor * partes.reduce((s, p) => s + p.peso, 0)) / 100);
  return valor;
}

export function parteDoViajante(l: Lancamento, viajanteId: string): number {
  if (!l.viajantesIds.includes(viajanteId)) return 0;
  const partes = calcularDivisao(l.valor, l.viajantesIds, l.divisao);
  return partes.find((p) => p.viajanteId === viajanteId)?.valor ?? 0;
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function limparNomeViagem(nome: string): string {
  return nome.replace(/ \(importado\)$/, "").replace(/ \(copia\)$/, "").trim();
}
