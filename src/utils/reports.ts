import type { Viagem } from "@/types";
import { totalGasto, totalReceita, saldo, gastosPorCategoria, fmtMoney, fmtDataCurta, fmtData, parteDoViajante, limparNomeViagem } from "./helpers";
import { staticMapUrlPerDay, googleMapsRouteUrl, getDayColors } from "./mapStatic";

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function sanitize(nome: string): string {
  return nome.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();
}

// ========== CSV Helpers ==========
function csvEscape(val: string | number): string {
  const s = String(val);
  if (s.includes(";") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function csvJoin(row: (string | number)[]): string {
  return row.map(csvEscape).join(";");
}

// ========== RELATÓRIO GERAL ==========
export function gerarRelatorioGeral(v: Viagem): string {
  const linhas: string[] = [];
  const g = totalGasto(v);
  const r = totalReceita(v);
  const s = saldo(v);
  const totalDias = v.dias.length || 1;
  const totalAtividades = v.dias.reduce((s2, d) => s2 + d.atividades.length, 0);
  const totalDespesas = v.lancamentos.filter((l) => l.tipo === "despesa").length;
  const totalReceitasCount = v.lancamentos.filter((l) => l.tipo === "receita").length;

  linhas.push("RELATÓRIO GERAL DA VIAGEM");
  linhas.push("=".repeat(40));
  linhas.push("");
  linhas.push(`Destino: ${limparNomeViagem(v.destino)}`);
  linhas.push(`Período: ${fmtDataCurta(v.inicio)} — ${fmtDataCurta(v.fim)}`);
  linhas.push(`Dias: ${v.dias.length}`);
  linhas.push(`Orçamento: ${fmtMoney(v.orcamento)}`);
  linhas.push("");

  // Resumo Financeiro
  linhas.push("RESUMO FINANCEIRO");
  linhas.push("-".repeat(30));
  linhas.push(`Total Gasto: ${fmtMoney(g)}`);
  linhas.push(`Total Receita: ${fmtMoney(r)}`);
  linhas.push(`Saldo: ${fmtMoney(s)}`);
  linhas.push(`Restante do Orçamento: ${fmtMoney(v.orcamento - g)}`);
  const pctOrc = v.orcamento > 0 ? ((g / v.orcamento) * 100).toFixed(1) : "0";
  linhas.push(`Utilização do Orçamento: ${pctOrc}%`);
  linhas.push("");

  // Custos Médios
  linhas.push("CUSTOS MÉDIOS");
  linhas.push("-".repeat(30));
  const custoMedioDiario = g / totalDias;
  linhas.push(`Custo Médio Diário: ${fmtMoney(custoMedioDiario)}`);
  if (v.viajantes.length > 0) {
    const custoMedioViajante = g / v.viajantes.length;
    linhas.push(`Custo Médio por Viajante: ${fmtMoney(custoMedioViajante)}`);
  }
  linhas.push("");

  // Detalhamento por Viajante
  if (v.viajantes.length > 0) {
    linhas.push("DETALHAMENTO POR VIAJANTE");
    linhas.push("-".repeat(30));
    v.viajantes.forEach((viaj) => {
      let total = 0;
      v.lancamentos.filter((l) => l.tipo === "despesa" && l.viajantesIds.includes(viaj.id)).forEach((l) => {
        total += parteDoViajante(l, viaj.id);
      });
      const pct = g > 0 ? ((total / g) * 100).toFixed(1) : "0";
      const mediaDia = total / totalDias;
      linhas.push(`${viaj.nome}: ${fmtMoney(total)} (${pct}%) — Média/dia: ${fmtMoney(mediaDia)}`);
    });
    linhas.push("");
  }

  // Detalhamento por Conta
  linhas.push("DETALHAMENTO POR CONTA");
  linhas.push("-".repeat(30));
  const contasMap = new Map<string, { nome: string; tipo: string; count: number; total: number }>();
  v.lancamentos.filter((l) => l.tipo === "despesa").forEach((l) => {
    const conta = v.contas.find((c) => c.id === l.contaId);
    const key = l.contaId;
    if (contasMap.has(key)) {
      const entry = contasMap.get(key)!;
      entry.count++;
      entry.total += l.valor;
    } else {
      contasMap.set(key, { nome: conta?.nome ?? "Desconhecida", tipo: conta?.tipo ?? "-", count: 1, total: l.valor });
    }
  });
  const contasArr = Array.from(contasMap.values()).sort((a, b) => b.total - a.total);
  contasArr.forEach((c) => {
    const pct = g > 0 ? ((c.total / g) * 100).toFixed(1) : "0";
    linhas.push(`${c.nome} (${c.tipo}): ${c.count} lançamentos — ${fmtMoney(c.total)} (${pct}%)`);
  });
  linhas.push("");

  // Gastos por Categoria (com %)
  linhas.push("GASTOS POR CATEGORIA");
  linhas.push("-".repeat(30));
  gastosPorCategoria(v).forEach(({ categoria, total }) => {
    const pct = g > 0 ? ((total / g) * 100).toFixed(1) : "0";
    linhas.push(`${categoria.nome}: ${fmtMoney(total)} (${pct}%)`);
  });
  linhas.push("");

  // Dia mais caro e mais barato
  if (v.dias.length > 0) {
    linhas.push("DIA MAIS CARO / MAIS BARATO");
    linhas.push("-".repeat(30));
    const diasComGasto = v.dias.map((d) => ({
      data: d.data,
      total: d.atividades.reduce((s2, a) => s2 + a.custo, 0) +
        v.lancamentos.filter((l) => l.tipo === "despesa" && l.diaIndex === v.dias.indexOf(d)).reduce((s2, l) => s2 + l.valor, 0),
    }));
    const maisCaro = diasComGasto.reduce((max, d) => d.total > max.total ? d : max, diasComGasto[0]);
    const maisBarato = diasComGasto.reduce((min, d) => d.total < min.total ? d : min, diasComGasto[0]);
    linhas.push(`Mais Caro: ${fmtDataCurta(maisCaro.data)} — ${fmtMoney(maisCaro.total)}`);
    linhas.push(`Mais Barato: ${fmtDataCurta(maisBarato.data)} — ${fmtMoney(maisBarato.total)}`);
    linhas.push("");
  }

  // Métodos de Pagamento
  linhas.push("MÉTODOS DE PAGAMENTO");
  linhas.push("-".repeat(30));
  const fpMap = new Map<string, { nome: string; count: number; total: number }>();
  v.lancamentos.filter((l) => l.tipo === "despesa").forEach((l) => {
    const fp = v.formasPagamento.find((f) => f.id === l.formaPagamentoId);
    const key = l.formaPagamentoId;
    if (fpMap.has(key)) {
      const entry = fpMap.get(key)!;
      entry.count++;
      entry.total += l.valor;
    } else {
      fpMap.set(key, { nome: fp?.nome ?? "Desconhecido", count: 1, total: l.valor });
    }
  });
  const fpArr = Array.from(fpMap.values()).sort((a, b) => b.total - a.total);
  fpArr.forEach((f) => {
    linhas.push(`${f.nome}: ${f.count} lançamentos — ${fmtMoney(f.total)}`);
  });
  linhas.push("");

  // Atividades
  linhas.push("ATIVIDADES");
  linhas.push("-".repeat(30));
  linhas.push(`Total: ${totalAtividades} atividades`);
  linhas.push(`Média por Dia: ${(totalAtividades / totalDias).toFixed(1)} atividades/dia`);
  linhas.push("");

  // Lançamentos
  linhas.push("LANÇAMENTOS");
  linhas.push("-".repeat(30));
  linhas.push(`Despesas: ${totalDespesas}`);
  linhas.push(`Receitas: ${totalReceitasCount}`);
  linhas.push(`Total: ${v.lancamentos.length}`);

  return linhas.join("\n");
}

export function exportarRelatorioGeral(v: Viagem) {
  download(`relatorio_geral_${sanitize(v.destino)}.txt`, gerarRelatorioGeral(v), "text/plain;charset=utf-8");
}

// ========== RELATÓRIO FINANCEIRO ==========
export function gerarRelatorioFinanceiro(v: Viagem): string {
  const linhas: string[] = [];
  linhas.push("RELATÓRIO FINANCEIRO");
  linhas.push("=".repeat(40));
  linhas.push(`Viagem: ${limparNomeViagem(v.destino)}`);
  linhas.push(`Período: ${fmtDataCurta(v.inicio)} — ${fmtDataCurta(v.fim)}`);
  linhas.push("");
  linhas.push("RESUMO");
  linhas.push(`Orçamento Total: ${fmtMoney(v.orcamento)}`);
  linhas.push(`Total Despesas: ${fmtMoney(totalGasto(v))}`);
  linhas.push(`Total Receitas: ${fmtMoney(totalReceita(v))}`);
  linhas.push(`Saldo: ${fmtMoney(saldo(v))}`);
  linhas.push(`% Utilizado: ${v.orcamento > 0 ? ((totalGasto(v) / v.orcamento) * 100).toFixed(1) : 0}%`);
  linhas.push("");
  linhas.push("DETALHAMENTO POR CATEGORIA");
  linhas.push("-".repeat(40));
  gastosPorCategoria(v).forEach(({ categoria, total }) => {
    const pct = totalGasto(v) > 0 ? ((total / totalGasto(v)) * 100).toFixed(1) : "0";
    linhas.push(`${categoria.nome}: ${fmtMoney(total)} (${pct}%)`);
  });
  linhas.push("");
  linhas.push("TODOS OS LANÇAMENTOS");
  linhas.push("-".repeat(40));
  v.lancamentos.forEach((l) => {
    const cat = v.categorias.find((c) => c.id === l.categoriaId);
    linhas.push(`${l.data} | ${l.tipo === "despesa" ? "DESPESA " : "RECEITA "} | ${fmtMoney(l.valor).padStart(10)} | ${l.descricao} | ${cat?.nome ?? "-"}`);
  });
  return linhas.join("\n");
}

export function exportarRelatorioFinanceiro(v: Viagem) {
  download(`relatorio_financeiro_${sanitize(v.destino)}.txt`, gerarRelatorioFinanceiro(v), "text/plain;charset=utf-8");
}

// ========== RELATÓRIO CSV FINANCEIRO ==========
export function exportarFinanceiroCSV(v: Viagem) {
  const linhas: string[] = [];
  linhas.push(csvJoin(["Data", "Tipo", "Descrição", "Categoria", "Subcategoria", "Valor", "Conta", "Forma Pgto", "Viajantes"]));
  v.lancamentos.forEach((l) => {
    const cat = v.categorias.find((c) => c.id === l.categoriaId);
    const sub = cat?.subcategorias.find((s) => s.id === l.subcategoriaId);
    const nomes = l.viajantesIds.map((id) => v.viajantes.find((x) => x.id === id)?.nome ?? id).join(", ");
    linhas.push(csvJoin([l.data, l.tipo, l.descricao, cat?.nome ?? "", sub?.nome ?? "", l.valor, l.contaId, l.formaPagamentoId, nomes]));
  });
  download(`financeiro_${sanitize(v.destino)}.csv`, linhas.join("\n"), "text/csv;charset=utf-8");
}

// ========== RELATÓRIO DE ATIVIDADES ==========
export function gerarRelatorioAtividades(v: Viagem): string {
  const linhas: string[] = [];
  linhas.push("RELATÓRIO DE ATIVIDADES");
  linhas.push("=".repeat(40));
  linhas.push(`Viagem: ${limparNomeViagem(v.destino)}`);
  linhas.push("");
  v.dias.forEach((d) => {
    linhas.push(`${fmtDataCurta(d.data)} (${d.atividades.length} atividades)`);
    linhas.push("-".repeat(30));
    if (d.relato) linhas.push(`Memorial: ${d.relato}`);
    d.atividades.forEach((a) => {
      linhas.push(`  ${a.hora} — ${a.titulo}`);
      linhas.push(`    Local: ${a.local}`);
      if (a.custo > 0) linhas.push(`    Custo: ${fmtMoney(a.custo)}`);
      if (a.notas) linhas.push(`    Notas: ${a.notas}`);
      if (a.nota) linhas.push(`    Avaliação: ${"★".repeat(a.nota)}${"☆".repeat(5 - a.nota)}`);
      if (a.fotos && a.fotos.length > 0) linhas.push(`    Fotos: ${a.fotos.length}`);
    });
    linhas.push("");
  });
  const totalCusto = v.dias.reduce((s, d) => s + d.atividades.reduce((s2, a) => s2 + a.custo, 0), 0);
  linhas.push(`CUSTO TOTAL DAS ATIVIDADES: ${fmtMoney(totalCusto)}`);
  return linhas.join("\n");
}

export function exportarRelatorioAtividades(v: Viagem) {
  download(`atividades_${sanitize(v.destino)}.txt`, gerarRelatorioAtividades(v), "text/plain;charset=utf-8");
}

// ========== RELATÓRIO POR VIAJANTE ==========
export function gerarRelatorioViajantes(v: Viagem): string {
  const linhas: string[] = [];
  linhas.push("RELATÓRIO POR VIAJANTE");
  linhas.push("=".repeat(40));
  linhas.push(`Viagem: ${limparNomeViagem(v.destino)}`);
  linhas.push("");
  v.viajantes.forEach((viaj) => {
    linhas.push(`${viaj.nome.toUpperCase()}`);
    linhas.push("-".repeat(30));
    let total = 0;
    v.lancamentos.filter((l) => l.tipo === "despesa" && l.viajantesIds.includes(viaj.id)).forEach((l) => {
      const parte = parteDoViajante(l, viaj.id);
      total += parte;
      linhas.push(`  ${l.data} | ${l.descricao} | ${fmtMoney(parte)}`);
    });
    linhas.push(`  TOTAL: ${fmtMoney(total)}`);
    linhas.push("");
  });
  return linhas.join("\n");
}

export function exportarRelatorioViajantes(v: Viagem) {
  download(`viajantes_${sanitize(v.destino)}.txt`, gerarRelatorioViajantes(v), "text/plain;charset=utf-8");
}

// ========== RELATÓRIO CHECKLIST ==========
export function gerarRelatorioChecklist(v: Viagem): string {
  const linhas: string[] = [];
  linhas.push("RELATÓRIO DE CHECKLIST");
  linhas.push("=".repeat(40));
  linhas.push(`Viagem: ${limparNomeViagem(v.destino)}`);
  linhas.push("");
  const done = v.checklist.filter((c) => c.done).length;
  linhas.push(`Progresso: ${done}/${v.checklist.length} (${v.checklist.length > 0 ? ((done / v.checklist.length) * 100).toFixed(0) : 0}%)`);
  linhas.push("");
  const grupos = v.gruposChecklist;
  grupos.forEach((grupo) => {
    const items = v.checklist.filter((c) => c.grupo === grupo);
    if (items.length === 0) return;
    const gDone = items.filter((i) => i.done).length;
    linhas.push(`${grupo} (${gDone}/${items.length})`);
    linhas.push("-".repeat(30));
    items.forEach((item) => {
      linhas.push(`  [${item.done ? "X" : " "}] ${item.urgente ? "⚠ " : ""}${item.titulo}`);
    });
    linhas.push("");
  });
  return linhas.join("\n");
}

export function exportarRelatorioChecklist(v: Viagem) {
  download(`checklist_${sanitize(v.destino)}.txt`, gerarRelatorioChecklist(v), "text/plain;charset=utf-8");
}

// ========== RELATÓRIO JSON COMPLETO ==========
export function exportarJSON(v: Viagem) {
  const now = new Date();
  const dataHora = `${now.getDate().toString().padStart(2, "0")}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now.getFullYear()}_${now.getHours().toString().padStart(2, "0")}-${now.getMinutes().toString().padStart(2, "0")}`;
  download(`viagem_${sanitize(v.destino)}_${dataHora}.txt`, JSON.stringify(v, null, 2), "text/plain;charset=utf-8");
}

// ========== RELATÓRIO PROFISSIONAL (HTML para impressão) ==========
export function gerarHTMLProfissional(v: Viagem): string {
  const gastos = totalGasto(v);
  const receitas = totalReceita(v);
  const categorias = gastosPorCategoria(v);
  const allCoords = v.dias.flatMap((d) => d.atividades.filter((a) => a.coord).map((a) => a.coord!));
  const mapImg = allCoords.length >= 2 ? staticMapUrlPerDay(v, 760, 400) : "";
  const routeLink = allCoords.length >= 2 ? googleMapsRouteUrl(allCoords) : "";
  const dayColors = getDayColors();
  const totalLocais = allCoords.length;
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Relatório — ${limparNomeViagem(v.destino)}</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; color: #1e293b; line-height: 1.6; }
  h1 { color: #0d9488; border-bottom: 3px solid #0d9488; padding-bottom: 8px; font-size: 24px; }
  h2 { color: #334155; font-size: 18px; margin-top: 30px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
  .header { text-align: center; margin-bottom: 40px; }
  .header h1 { font-size: 28px; }
  .header p { color: #64748b; font-size: 14px; }
  .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 20px 0; }
  .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; text-align: center; }
  .summary-card .label { font-size: 12px; color: #64748b; text-transform: uppercase; }
  .summary-card .value { font-size: 20px; font-weight: 700; margin-top: 4px; }
  .summary-card .value.expense { color: #e11d48; }
  .summary-card .value.income { color: #16a34a; }
  .summary-card .value.budget { color: #0d9488; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px; }
  th { background: #f1f5f9; text-align: left; padding: 8px 12px; font-weight: 600; border-bottom: 2px solid #e2e8f0; }
  td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; }
  tr:hover td { background: #f8fafc; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
  .badge.expense { background: #fef2f2; color: #e11d48; }
  .badge.income { background: #f0fdf4; color: #16a34a; }
  .footer { margin-top: 40px; text-align: center; color: #94a3b8; font-size: 11px; border-top: 1px solid #e2e8f0; padding-top: 16px; }
  @media print { body { padding: 20px; } .no-print { display: none; } }
</style>
</head>
<body>
<div class="header">
  <h1>✈ Relatório de Viagem</h1>
  <p>${limparNomeViagem(v.destino)} — ${fmtDataCurta(v.inicio)} a ${fmtDataCurta(v.fim)}</p>
  <p>Gerado em ${new Date().toLocaleDateString("pt-BR")}</p>
</div>

<div class="summary">
  <div class="summary-card"><div class="label">Orçamento</div><div class="value budget">${fmtMoney(v.orcamento)}</div></div>
  <div class="summary-card"><div class="label">Despesas</div><div class="value expense">${fmtMoney(gastos)}</div></div>
  <div class="summary-card"><div class="label">Receitas</div><div class="value income">${fmtMoney(receitas)}</div></div>
  <div class="summary-card"><div class="label">Saldo</div><div class="value ${saldo(v) >= 0 ? "income" : "expense"}">${fmtMoney(saldo(v))}</div></div>
</div>

<h2>Gastos por Categoria</h2>
<table>
  <thead><tr><th>Categoria</th><th>Valor</th><th>%</th></tr></thead>
  <tbody>
    ${categorias.map(({ categoria, total }) => `<tr><td>${categoria.nome}</td><td>${fmtMoney(total)}</td><td>${gastos > 0 ? ((total / gastos) * 100).toFixed(1) : 0}%</td></tr>`).join("")}
  </tbody>
</table>

<h2>Itinerário</h2>
${v.dias.map((d) => `
<h3>${fmtDataCurta(d.data)}</h3>
<table>
  <thead><tr><th>Hora</th><th>Atividade</th><th>Local</th><th>Custo</th></tr></thead>
  <tbody>
    ${d.atividades.map((a) => `<tr><td>${a.hora}</td><td>${a.titulo}</td><td>${a.local}</td><td>${a.custo > 0 ? fmtMoney(a.custo) : "-"}</td></tr>`).join("")}
  </tbody>
</table>
${d.relato ? `<p><em>${d.relato}</em></p>` : ""}`).join("")}

${mapImg ? `
<h2>🗺 Rota Percorrida</h2>
<div style="text-align:center;margin:20px 0">
  <img src="${mapImg}" alt="Mapa da Rota" style="max-width:100%;border-radius:8px;border:1px solid #e2e8f0" />
  <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:12px;margin-top:12px;font-size:12px;color:#64748b">
    ${v.dias.map((d, i) => {
      const dayCoords = d.atividades.filter((a) => a.coord).length;
      if (dayCoords === 0) return "";
      const color = dayColors[i % dayColors.length];
      const hexColor = "#" + color.replace("0x", "");
      return `<span style="display:flex;align-items:center;gap:4px"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${hexColor}"></span>Dia ${i + 1}: ${fmtDataCurta(d.data)} (${dayCoords} locais)</span>`;
    }).join("")}
  </div>
  <p style="color:#94a3b8;font-size:11px;margin-top:8px">Total: ${totalLocais} locais mapeados em ${v.dias.filter(d => d.atividades.some(a => a.coord)).length} dias</p>
  ${routeLink ? `<p style="margin-top:12px"><a href="${routeLink}" target="_blank" style="color:#0d9488;font-size:13px;font-weight:600;text-decoration:none">📍 Abrir rota completa no Google Maps</a></p>` : ""}
</div>` : ""}

<h2>Lançamentos Financeiros</h2>
<table>
  <thead><tr><th>Data</th><th>Tipo</th><th>Descrição</th><th>Categoria</th><th>Valor</th></tr></thead>
  <tbody>
    ${v.lancamentos.map((l) => {
      const cat = v.categorias.find((c) => c.id === l.categoriaId);
      return `<tr><td>${fmtData(l.data)}</td><td><span class="badge ${l.tipo}">${l.tipo === "despesa" ? "Despesa" : "Receita"}</span></td><td>${l.descricao}</td><td>${cat?.nome ?? "-"}</td><td>${fmtMoney(l.valor)}</td></tr>`;
    }).join("")}
  </tbody>
</table>

<h2>Checklist</h2>
${v.gruposChecklist.map((g) => {
  const items = v.checklist.filter((c) => c.grupo === g);
  if (items.length === 0) return "";
  return `<h3>${g}</h3><ul>${items.map((i) => `<li>[${i.done ? "x" : " "}] ${i.urgente ? "⚠ " : ""}${i.titulo}</li>`).join("")}</ul>`;
}).join("")}

<h2>Viajantes</h2>
<p>${v.viajantes.map((x) => `${x.nome} (${x.cor})`).join(" • ")}</p>

<div class="footer">
  Meu Roteiro de Viagem — Relatório gerado automaticamente
</div>
</body>
</html>`;
}

export function exportarRelatorioProfissional(v: Viagem) {
  const html = gerarHTMLProfissional(v);
  download(`relatorio_profissional_${sanitize(v.destino)}.html`, html, "text/html;charset=utf-8");
}

export function imprimirRelatorio(v: Viagem) {
  const html = gerarHTMLProfissional(v);
  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
    win.print();
  }
}

// ========== LISTA DE RELATÓRIOS ==========
export type RelatorioTipo = {
  id: string;
  nome: string;
  descricao: string;
  icone: string;
  exportar: (v: Viagem) => void;
};

export function getRelatorios(): RelatorioTipo[] {
  return [
    { id: "geral", nome: "Relatório Geral", descricao: "Resumo completo da viagem", icone: "📋", exportar: exportarRelatorioGeral },
    { id: "financeiro", nome: "Relatório Financeiro", descricao: "Detalhamento de despesas e receitas", icone: "💰", exportar: exportarRelatorioFinanceiro },
    { id: "csv", nome: "Financeiro CSV", descricao: "Exportar lançamentos em planilha", icone: "📊", exportar: exportarFinanceiroCSV },
    { id: "atividades", nome: "Relatório de Atividades", descricao: "Roteiro completo com custos", icone: "🗓️", exportar: exportarRelatorioAtividades },
    { id: "viajantes", nome: "Relatório por Viajante", descricao: "Gastos individuais de cada viajante", icone: "👥", exportar: exportarRelatorioViajantes },
    { id: "checklist", nome: "Relatório de Checklist", descricao: "Status de preparação da viagem", icone: "✅", exportar: exportarRelatorioChecklist },
    { id: "profissional", nome: "Relatório Profissional", descricao: "Documento HTML formatado para impressão", icone: "📄", exportar: exportarRelatorioProfissional },
    { id: "imprimir", nome: "Imprimir Relatório", descricao: "Abrir relatório profissional para impressão", icone: "🖨️", exportar: imprimirRelatorio },
    { id: "json", nome: "Exportar JSON", descricao: "Backup completo dos dados da viagem", icone: "💾", exportar: exportarJSON },
  ];
}
