import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Viagem, Coord } from "@/types";
import { totalGasto, totalReceita, saldo, gastosPorCategoria, fmtMoney, fmtDataCurta, parteDoViajante, limparNomeViagem } from "./helpers";
import { staticMapUrlPerDay, googleMapsRouteUrl } from "./mapStatic";

const DAY_COLORS_RGB: [number, number, number][] = [
  [13, 148, 136],
  [225, 29, 72],
  [37, 99, 235],
  [245, 158, 11],
  [124, 58, 237],
  [219, 39, 119],
  [22, 163, 74],
  [8, 145, 178],
  [124, 45, 18],
  [251, 146, 60],
];

const C = {
  primary: [13, 148, 136] as [number, number, number],
  dark: [15, 23, 42] as [number, number, number],
  muted: [100, 116, 139] as [number, number, number],
  light: [241, 245, 249] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  red: [225, 29, 72] as [number, number, number],
  green: [22, 163, 74] as [number, number, number],
  amber: [245, 158, 11] as [number, number, number],
  blue: [37, 99, 235] as [number, number, number],
  violet: [124, 58, 237] as [number, number, number],
  pink: [219, 39, 119] as [number, number, number],
  cyan: [8, 145, 178] as [number, number, number],
  brown: [124, 45, 18] as [number, number, number],
  palette: [[13,148,136],[225,29,72],[37,99,235],[245,158,11],[124,58,237],[219,39,119],[22,163,74],[8,145,178],[124,45,18],[251,146,60]] as [number,number,number][],
};

function sn(n: string) { return n.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase(); }
function mkPDF(): jsPDF { return new jsPDF({ unit: "mm", format: "a4" }); }

function hdr(doc: jsPDF, title: string, v: Viagem) {
  doc.setFillColor(...C.primary); doc.rect(0, 0, 210, 35, "F");
  doc.setTextColor(...C.white); doc.setFontSize(22); doc.setFont("helvetica", "bold");
  doc.text(title, 20, 18);
  doc.setFontSize(11); doc.setFont("helvetica", "normal");
  doc.text(limparNomeViagem(v.destino) + "  |  " + fmtDataCurta(v.inicio) + " a " + fmtDataCurta(v.fim), 20, 26);
  doc.setFontSize(8); doc.text("Gerado em " + new Date().toLocaleDateString("pt-BR"), 20, 32);
}

function ftr(doc: jsPDF) {
  const h = doc.internal.pageSize.getHeight();
  doc.setFillColor(...C.light); doc.rect(0, h - 12, 210, 12, "F");
  doc.setTextColor(...C.muted); doc.setFontSize(7);
  doc.text("Meu Roteiro de Viagem — Relatorio Profissional", 20, h - 7);
  doc.text("Pag. " + doc.getNumberOfPages(), 190, h - 7, { align: "right" });
}

function sec(doc: jsPDF, y: number, t: string) {
  doc.setFillColor(...C.primary); doc.roundedRect(15, y, 180, 8, 2, 2, "F");
  doc.setTextColor(...C.white); doc.setFontSize(11); doc.setFont("helvetica", "bold");
  doc.text(t, 20, y + 5.5); return y + 14;
}

function cp(doc: jsPDF, y: number, n: number) {
  if (y + n > doc.internal.pageSize.getHeight() - 20) { doc.addPage(); ftr(doc); return 20; } return y;
}

const tbl = (y: number) => ({
  startY: y, theme: "grid" as const,
  headStyles: { fillColor: C.primary, textColor: C.white, fontStyle: "bold" as const, fontSize: 8 },
  bodyStyles: { fontSize: 8, textColor: C.dark },
  alternateRowStyles: { fillColor: C.light },
  margin: { left: 15, right: 15 },
});

// ========== CHART: Bar Vertical ==========
function drawBarChart(doc: jsPDF, x: number, y: number, w: number, h: number,
  data: { label: string; value: number; color: [number,number,number] }[]) {
  if (data.length === 0) return;
  const max = Math.max(...data.map(d => d.value), 1);
  const barW = Math.min((w - 10) / data.length - 4, 20);
  const gap = (w - 10 - barW * data.length) / (data.length + 1);

  // Grid lines
  doc.setDrawColor(...C.light); doc.setLineWidth(0.3);
  for (let i = 0; i <= 4; i++) {
    const gy = y + h - (h * i / 4);
    doc.line(x + 5, gy, x + w - 5, gy);
    doc.setTextColor(...C.muted); doc.setFontSize(6);
    doc.text(fmtMoney(max * i / 4), x + 2, gy + 1.5, { align: "right" });
  }

  // Bars
  data.forEach((d, i) => {
    const bx = x + gap + i * (barW + gap) + 5;
    const bh = max > 0 ? (d.value / max) * (h - 15) : 0;
    const by = y + h - bh - 10;

    // Shadow
    doc.setFillColor(200, 200, 200); doc.roundedRect(bx + 1, by + 1, barW, bh, 2, 2, "F");
    // Bar
    doc.setFillColor(...d.color); doc.roundedRect(bx, by, barW, bh, 2, 2, "F");
    // Value on top
    doc.setTextColor(...C.dark); doc.setFontSize(6); doc.setFont("helvetica", "bold");
    if (bh > 8) doc.text(fmtMoney(d.value), bx + barW / 2, by + 4, { align: "center" });
    // Label
    doc.setTextColor(...C.muted); doc.setFontSize(6); doc.setFont("helvetica", "normal");
    const lbl = d.label.length > 8 ? d.label.slice(0, 7) + "." : d.label;
    doc.text(lbl, bx + barW / 2, y + h + 4, { align: "center" });
  });
}

// ========== CHART: Pie / Donut ==========
function drawPieChart(doc: jsPDF, cx: number, cy: number, r: number,
  data: { label: string; value: number; color: [number,number,number] }[]) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return;
  let startAngle = -Math.PI / 2;

  data.forEach((d, i) => {
    const sliceAngle = (d.value / total) * 2 * Math.PI;
    const endAngle = startAngle + sliceAngle;

    // Draw arc segments (approximate with lines)
    const steps = Math.max(Math.ceil(sliceAngle / 0.1), 10);
    const stepAngle = sliceAngle / steps;

    doc.setFillColor(...d.color);
    doc.setDrawColor(...C.white); doc.setLineWidth(0.5);

    // Fill: draw lines from center to arc
    const points: [number, number][] = [];
    for (let s = 0; s <= steps; s++) {
      const angle = startAngle + s * stepAngle;
      points.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
    }

    // Draw filled polygon using lines from center
    for (let s = 0; s < steps; s++) {
      doc.setFillColor(...d.color);
      doc.triangle(cx, cy, points[s][0], points[s][1], points[s + 1][0], points[s + 1][1], "F");
    }

    // Label
    const midAngle = startAngle + sliceAngle / 2;
    const pct = ((d.value / total) * 100).toFixed(0);
    if (parseFloat(pct) > 5) {
      const lx = cx + (r * 0.65) * Math.cos(midAngle);
      const ly = cy + (r * 0.65) * Math.sin(midAngle);
      doc.setTextColor(...C.white); doc.setFontSize(7); doc.setFont("helvetica", "bold");
      doc.text(pct + "%", lx, ly + 1.5, { align: "center" });
    }

    startAngle = endAngle;
  });

  // Center hole (donut)
  doc.setFillColor(...C.white);
  doc.circle(cx, cy, r * 0.4, "F");
  doc.setTextColor(...C.dark); doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text(fmtMoney(total), cx, cy + 1, { align: "center" });
  doc.setTextColor(...C.muted); doc.setFontSize(6);
  doc.text("Total", cx, cy + 5, { align: "center" });

  // Legend
  let ly = cy - r - 5;
  const lx = cx + r + 10;
  data.forEach((d, i) => {
    if (i > 5) return; // max 6 items in legend
    doc.setFillColor(...d.color); doc.roundedRect(lx, ly + i * 6, 3, 3, 1, 1, "F");
    doc.setTextColor(...C.dark); doc.setFontSize(7); doc.setFont("helvetica", "normal");
    doc.text(d.label, lx + 5, ly + i * 6 + 2.5);
  });
}

// ========== CHART: Horizontal Bar ==========
function drawHBarChart(doc: jsPDF, x: number, y: number, w: number,
  data: { label: string; value: number; color: [number,number,number] }[]) {
  if (data.length === 0) return y;
  const max = Math.max(...data.map(d => d.value), 1);
  const barH = 7;
  const gap = 3;
  const labelW = 35;
  const barArea = w - labelW - 20;

  data.forEach((d, i) => {
    const by = y + i * (barH + gap);
    const bw = max > 0 ? (d.value / max) * barArea : 0;

    // Label
    doc.setTextColor(...C.dark); doc.setFontSize(8); doc.setFont("helvetica", "normal");
    const lbl = d.label.length > 12 ? d.label.slice(0, 11) + "." : d.label;
    doc.text(lbl, x + labelW, by + barH / 2 + 1.5, { align: "right" });

    // Background
    doc.setFillColor(...C.light); doc.roundedRect(x + labelW + 2, by, barArea, barH, 2, 2, "F");
    // Bar
    if (bw > 0) { doc.setFillColor(...d.color); doc.roundedRect(x + labelW + 2, by, Math.max(bw, 4), barH, 2, 2, "F"); }
    // Value
    doc.setTextColor(...C.dark); doc.setFontSize(7); doc.setFont("helvetica", "bold");
    doc.text(fmtMoney(d.value), x + w - 2, by + barH / 2 + 1.5, { align: "right" });
  });

  return y + data.length * (barH + gap);
}

// ========== CHART: Line (diario) ==========
function drawLineChart(doc: jsPDF, x: number, y: number, w: number, h: number,
  data: { label: string; value: number }[]) {
  if (data.length === 0) return;
  const max = Math.max(...data.map(d => d.value), 1);
  const stepX = (w - 20) / Math.max(data.length - 1, 1);

  // Grid
  doc.setDrawColor(...C.light); doc.setLineWidth(0.3);
  for (let i = 0; i <= 4; i++) {
    const gy = y + h - (h * i / 4) - 10;
    doc.line(x + 10, gy, x + w - 10, gy);
    doc.setTextColor(...C.muted); doc.setFontSize(6);
    doc.text(fmtMoney(max * i / 4), x + 6, gy + 1.5, { align: "right" });
  }

  // Area fill
  const points: [number, number][] = data.map((d, i) => [
    x + 10 + i * stepX,
    y + h - (max > 0 ? (d.value / max) * (h - 20) : 0) - 10,
  ]);

  doc.setFillColor(200, 235, 230);
  doc.moveTo(points[0][0], y + h - 10);
  points.forEach(p => doc.lineTo(p[0], p[1]));
  doc.lineTo(points[points.length - 1][0], y + h - 10);
  doc.fill();

  // Line
  doc.setDrawColor(...C.primary); doc.setLineWidth(1.2);
  points.forEach((p, i) => { if (i > 0) doc.line(points[i - 1][0], points[i - 1][1], p[0], p[1]); });

  // Dots
  points.forEach((p, i) => {
    doc.setFillColor(...C.white); doc.setDrawColor(...C.primary); doc.setLineWidth(0.8);
    doc.circle(p[0], p[1], 2, "FD");
    if (data[i].value > 0) {
      doc.setTextColor(...C.dark); doc.setFontSize(5.5); doc.setFont("helvetica", "bold");
      doc.text(fmtMoney(data[i].value), p[0], p[1] - 4, { align: "center" });
    }
  });

  // X labels
  doc.setTextColor(...C.muted); doc.setFontSize(5.5); doc.setFont("helvetica", "normal");
  data.forEach((d, i) => {
    const lbl = d.label.length > 5 ? d.label.slice(0, 4) : d.label;
    doc.text(lbl, points[i][0], y + h + 4, { align: "center" });
  });
}

// ========== CARDS DE RESUMO ==========
function summaryCards(doc: jsPDF, y: number, v: Viagem) {
  const g = totalGasto(v), r = totalReceita(v), sd = saldo(v);
  const cards = [
    ["Orcamento", fmtMoney(v.orcamento), C.primary],
    ["Gastos", fmtMoney(g), C.red],
    ["Receitas", fmtMoney(r), C.green],
    ["Saldo", fmtMoney(sd), sd >= 0 ? C.green : C.red],
  ] as const;
  cards.forEach((c, i) => {
    const x = 15 + i * 46;
    doc.setFillColor(...C.light); doc.roundedRect(x, y, 42, 20, 3, 3, "F");
    doc.setFillColor(...c[2]); doc.roundedRect(x, y, 42, 3, 3, 3, "F");
    doc.setTextColor(...C.muted); doc.setFontSize(7); doc.text(c[0].toUpperCase(), x + 21, y + 10, { align: "center" });
    doc.setTextColor(...c[2]); doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.text(c[1], x + 21, y + 16, { align: "center" });
  });
  return y + 28;
}

// ========== RELATORIO GERAL ==========
export function gerarPDFGeral(v: Viagem) {
  const doc = mkPDF(); hdr(doc, "Relatorio Geral da Viagem", v); ftr(doc);
  let y = 42;
  y = summaryCards(doc, y, v);

  const g = totalGasto(v);
  const cats = gastosPorCategoria(v);
  const totalDias = v.dias.length || 1;
  const totalAtividades = v.dias.reduce((s, d) => s + d.atividades.length, 0);

  // Custos medios
  y = cp(doc, y, 20); y = sec(doc, y, "Custos Medios");
  const custoMedioDiario = g / totalDias;
  const custoMedioViajante = v.viajantes.length > 0 ? g / v.viajantes.length : 0;
  autoTable(doc, { ...tbl(y), theme: "plain", bodyStyles: { fontSize: 9, textColor: C.dark, cellPadding: 3 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 70 }, 1: { halign: "right" } },
    body: [
      ["Custo Medio Diario", fmtMoney(custoMedioDiario)],
      ["Custo Medio por Viajante", fmtMoney(custoMedioViajante)],
      ["Total de Dias", String(v.dias.length)],
      ["Total de Atividades", String(totalAtividades)],
    ] });
  y = (doc as any).lastAutoTable.finalY + 8;

  // Detalhamento por viajante
  if (v.viajantes.length > 0) {
    y = cp(doc, y, 40); y = sec(doc, y, "Detalhamento por Viajante");
    const viajRows = v.viajantes.map((viaj) => {
      let total = 0;
      v.lancamentos.filter((l) => l.tipo === "despesa" && l.viajantesIds.includes(viaj.id)).forEach((l) => {
        total += parteDoViajante(l, viaj.id);
      });
      const pct = g > 0 ? ((total / g) * 100).toFixed(1) : "0";
      const mediaDia = total / totalDias;
      return [viaj.nome, fmtMoney(total), pct + "%", fmtMoney(mediaDia)];
    });
    autoTable(doc, { ...tbl(y), head: [["Viajante", "Total", "%", "Media/dia"]], body: viajRows,
      columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" } } });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Detalhamento por conta
  y = cp(doc, y, 40); y = sec(doc, y, "Detalhamento por Conta");
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
  const contaRows = contasArr.map((c) => {
    const pct = g > 0 ? ((c.total / g) * 100).toFixed(1) : "0";
    return [c.nome, c.tipo, String(c.count), fmtMoney(c.total), pct + "%"];
  });
  autoTable(doc, { ...tbl(y), head: [["Conta", "Tipo", "Lanc.", "Total", "%"]], body: contaRows,
    columnStyles: { 2: { halign: "center" }, 3: { halign: "right" }, 4: { halign: "right" } } });
  y = (doc as any).lastAutoTable.finalY + 8;

  // Gastos por categoria (com %)
  if (cats.length > 0) {
    y = cp(doc, y, 40); y = sec(doc, y, "Gastos por Categoria");
    const catRows = cats.map(({ categoria: c, total: t }) => {
      const pct = g > 0 ? ((t / g) * 100).toFixed(1) : "0";
      return [c.nome, fmtMoney(t), pct + "%"];
    });
    autoTable(doc, { ...tbl(y), head: [["Categoria", "Total", "%"]], body: catRows,
      columnStyles: { 1: { halign: "right" }, 2: { halign: "right" } } });
    y = (doc as any).lastAutoTable.finalY + 8;

    // Grafico de barras
    y = cp(doc, y, 80); y = sec(doc, y, "Gastos por Categoria — Grafico");
    const barData = cats.slice(0, 8).map(({ categoria: c, total: t }, i) => ({
      label: c.nome, value: t, color: C.palette[i % C.palette.length],
    }));
    drawBarChart(doc, 15, y, 180, 50, barData);
    y += 58;

    // Grafico pizza
    y = cp(doc, y, 70); y = sec(doc, y, "Distribuicao de Gastos — Grafico Pizza");
    const pieData = cats.slice(0, 6).map(({ categoria: c, total: t }, i) => ({
      label: c.nome, value: t, color: C.palette[i % C.palette.length],
    }));
    drawPieChart(doc, 75, y + 30, 25, pieData);
    y += 65;
  }

  // Dia mais caro e mais barato
  if (v.dias.length > 0) {
    y = cp(doc, y, 30); y = sec(doc, y, "Dia Mais Caro / Mais Barato");
    const diasComGasto = v.dias.map((d, idx) => ({
      data: d.data,
      total: d.atividades.reduce((s2, a) => s2 + a.custo, 0) +
        v.lancamentos.filter((l) => l.tipo === "despesa" && l.diaIndex === idx).reduce((s2, l) => s2 + l.valor, 0),
    }));
    const maisCaro = diasComGasto.reduce((max, d) => d.total > max.total ? d : max, diasComGasto[0]);
    const maisBarato = diasComGasto.reduce((min, d) => d.total < min.total ? d : min, diasComGasto[0]);
    autoTable(doc, { ...tbl(y), theme: "plain", bodyStyles: { fontSize: 9, textColor: C.dark, cellPadding: 3 },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 50 }, 1: { halign: "right" } },
      body: [
        ["Mais Caro", fmtDataCurta(maisCaro.data) + " — " + fmtMoney(maisCaro.total)],
        ["Mais Barato", fmtDataCurta(maisBarato.data) + " — " + fmtMoney(maisBarato.total)],
      ] });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Metodos de pagamento
  y = cp(doc, y, 40); y = sec(doc, y, "Metodos de Pagamento");
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
  const fpRows = fpArr.map((f) => [f.nome, String(f.count), fmtMoney(f.total)]);
  autoTable(doc, { ...tbl(y), head: [["Metodo", "Lanc.", "Total"]], body: fpRows,
    columnStyles: { 1: { halign: "center" }, 2: { halign: "right" } } });
  y = (doc as any).lastAutoTable.finalY + 8;

  // Utilizacao do orcamento
  y = cp(doc, y, 20); y = sec(doc, y, "Utilizacao do Orcamento");
  const pctOrc = v.orcamento > 0 ? (g / v.orcamento) * 100 : 0;
  doc.setFillColor(...C.light); doc.roundedRect(20, y, 170, 10, 3, 3, "F");
  doc.setFillColor(...C.primary); doc.roundedRect(20, y, Math.max(170 * Math.min(pctOrc, 100) / 100, 0), 10, 3, 3, "F");
  doc.setTextColor(...C.dark); doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text(pctOrc.toFixed(1) + "% — " + fmtMoney(v.orcamento - g) + " restante", 105, y + 6.5, { align: "center" });
  y += 16;

  // Checklist
  y = cp(doc, y, 20); y = sec(doc, y, "Checklist — Progresso");
  const done = v.checklist.filter(c => c.done).length;
  const pctCl = v.checklist.length > 0 ? (done / v.checklist.length) * 100 : 0;
  doc.setFillColor(...C.light); doc.roundedRect(20, y, 170, 8, 3, 3, "F");
  doc.setFillColor(...C.primary); doc.roundedRect(20, y, Math.max(170 * pctCl / 100, 0), 8, 3, 3, "F");
  doc.setTextColor(...C.dark); doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text(done + "/" + v.checklist.length + " (" + pctCl.toFixed(0) + "%)", 105, y + 5.5, { align: "center" });

  doc.save("relatorio_geral_" + sn(v.destino) + ".pdf");
}

// ========== RELATORIO FINANCEIRO ==========
export function gerarPDFFinanceiro(v: Viagem) {
  const doc = mkPDF(); hdr(doc, "Relatorio Financeiro", v); ftr(doc);
  let y = 42;
  const g = totalGasto(v), r = totalReceita(v), sd = saldo(v);

  y = sec(doc, y, "Resumo Financeiro");
  autoTable(doc, { ...tbl(y), theme: "plain", bodyStyles: { fontSize: 10, textColor: C.dark, cellPadding: 3 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 60 }, 1: { halign: "right" } },
    body: [["Orcamento Total", fmtMoney(v.orcamento)], ["Total Despesas", fmtMoney(g)],
      ["Total Receitas", fmtMoney(r)], ["Saldo", fmtMoney(sd)],
      ["% Utilizado", (v.orcamento > 0 ? ((g / v.orcamento) * 100).toFixed(1) : "0") + "%"]] });
  y = (doc as any).lastAutoTable.finalY + 8;

  const cats = gastosPorCategoria(v);

  // Grafico de barras horizontais por categoria
  if (cats.length > 0) {
    y = cp(doc, y, 20 + cats.length * 12); y = sec(doc, y, "Gastos por Categoria — Grafico");
    const hData = cats.slice(0, 8).map(({ categoria: c, total: t }, i) => ({
      label: c.nome, value: t, color: C.palette[i % C.palette.length],
    }));
    y = drawHBarChart(doc, 15, y, 180, hData) + 8;
  }

  // Grafico pizza orcamento
  y = cp(doc, y, 70); y = sec(doc, y, "Composicao Financeira — Grafico Pizza");
  const pieData = [
    { label: "Despesas", value: g, color: C.red },
    { label: "Receitas", value: r, color: C.green },
    { label: "Restante", value: Math.max(v.orcamento - g, 0), color: C.light },
  ].filter(d => d.value > 0);
  drawPieChart(doc, 75, y + 30, 25, pieData);
  y += 65;

  // Tabela detalhada
  y = cp(doc, y, 40); y = sec(doc, y, "Detalhamento de Lancamentos");
  autoTable(doc, { ...tbl(y), head: [["Data", "Tipo", "Descricao", "Categoria", "Valor"]],
    body: v.lancamentos.map(l => { const c = v.categorias.find(x => x.id === l.categoriaId); return [l.data, l.tipo === "despesa" ? "Despesa" : "Receita", l.descricao, c?.nome ?? "-", fmtMoney(l.valor)]; }),
    columnStyles: { 4: { halign: "right" } } });

  doc.save("relatorio_financeiro_" + sn(v.destino) + ".pdf");
}

// ========== RELATORIO ATIVIDADES ==========
export function gerarPDFAtividades(v: Viagem) {
  const doc = mkPDF(); hdr(doc, "Relatorio de Atividades", v); ftr(doc);
  let y = 42;

  // Grafico de custo por dia
  const dailyCosts = v.dias.map((d, i) => ({
    label: fmtDataCurta(d.data),
    value: d.atividades.reduce((s, a) => s + a.custo, 0),
  }));
  if (dailyCosts.some(d => d.value > 0)) {
    y = cp(doc, y, 70); y = sec(doc, y, "Custo por Dia — Grafico de Linha");
    drawLineChart(doc, 15, y, 180, 45, dailyCosts);
    y += 55;
  }

  // Grafico de atividades por dia
  if (v.dias.length > 0) {
    y = cp(doc, y, 70); y = sec(doc, y, "Atividades por Dia — Grafico de Barras");
    const actData = v.dias.slice(0, 10).map((d, i) => ({
      label: fmtDataCurta(d.data),
      value: d.atividades.length,
      color: C.palette[i % C.palette.length],
    }));
    drawBarChart(doc, 15, y, 180, 40, actData);
    y += 50;
  }

  // Detalhamento por dia
  v.dias.forEach((d, idx) => {
    y = cp(doc, y, 30); y = sec(doc, y, fmtDataCurta(d.data) + " - Dia " + (idx + 1));
    if (d.relato) { doc.setTextColor(...C.muted); doc.setFontSize(9); doc.setFont("helvetica", "italic");
      const lines = doc.splitTextToSize("Memorial: " + d.relato, 170); doc.text(lines, 20, y); y += lines.length * 4 + 4; }
    if (d.atividades.length > 0) {
      autoTable(doc, { ...tbl(y), head: [["Hora", "Atividade", "Local", "Custo"]],
        body: d.atividades.map(a => [a.hora, a.titulo, a.local, a.custo > 0 ? fmtMoney(a.custo) : "-"]),
        columnStyles: { 3: { halign: "right" } } });
      y = (doc as any).lastAutoTable.finalY + 6;
    }
  });

  const tc = v.dias.reduce((s, d) => s + d.atividades.reduce((s2, a) => s2 + a.custo, 0), 0);
  y = cp(doc, y, 12);
  doc.setFillColor(...C.primary); doc.roundedRect(15, y, 180, 10, 2, 2, "F");
  doc.setTextColor(...C.white); doc.setFontSize(11); doc.setFont("helvetica", "bold");
  doc.text("CUSTO TOTAL: " + fmtMoney(tc), 20, y + 7);

  doc.save("atividades_" + sn(v.destino) + ".pdf");
}

// ========== RELATORIO VIAJANTES ==========
export function gerarPDFViajantes(v: Viagem) {
  const doc = mkPDF(); hdr(doc, "Relatorio por Viajante", v); ftr(doc);
  let y = 42;

  const viajTotais = v.viajantes.map((vi, i) => {
    const total = v.lancamentos.filter(l => l.tipo === "despesa" && l.viajantesIds.includes(vi.id))
      .reduce((s, l) => s + parteDoViajante(l, vi.id), 0);
    return { label: vi.nome, value: total, color: C.palette[i % C.palette.length] };
  });

  // Grafico barras horizontais por viajante
  if (viajTotais.some(vt => vt.value > 0)) {
    y = sec(doc, y, "Gastos por Viajante — Grafico");
    y = drawHBarChart(doc, 15, y, 180, viajTotais.filter(vt => vt.value > 0)) + 8;
  }

  // Grafico pizza
  if (viajTotais.some(vt => vt.value > 0)) {
    y = cp(doc, y, 70); y = sec(doc, y, "Proporcao por Viajante — Grafico Pizza");
    drawPieChart(doc, 75, y + 30, 25, viajTotais.filter(vt => vt.value > 0));
    y += 65;
  }

  // Detalhamento
  v.viajantes.forEach(vi => {
    y = cp(doc, y, 40); y = sec(doc, y, vi.nome);
    const des = v.lancamentos.filter(l => l.tipo === "despesa" && l.viajantesIds.includes(vi.id));
    let total = 0;
    if (des.length > 0) {
      autoTable(doc, { ...tbl(y), head: [["Data", "Descricao", "Sua Parte"]],
        body: des.map(l => { const p = parteDoViajante(l, vi.id); total += p; return [l.data, l.descricao, fmtMoney(p)]; }),
        columnStyles: { 2: { halign: "right" } } });
      y = (doc as any).lastAutoTable.finalY + 4;
    }
    doc.setFillColor(...C.light); doc.roundedRect(15, y, 180, 8, 2, 2, "F");
    doc.setTextColor(...C.dark); doc.setFontSize(10); doc.setFont("helvetica", "bold");
    doc.text("Total: " + fmtMoney(total), 165, y + 5.5, { align: "right" }); y += 16;
  });

  doc.save("viajantes_" + sn(v.destino) + ".pdf");
}

// ========== RELATORIO CHECKLIST ==========
export function gerarPDFChecklist(v: Viagem) {
  const doc = mkPDF(); hdr(doc, "Relatorio de Checklist", v); ftr(doc);
  let y = 42;
  const done = v.checklist.filter(c => c.done).length, total = v.checklist.length;
  const pct = total > 0 ? (done / total) * 100 : 0;

  // Grafico de progresso geral (gauge-like)
  y = sec(doc, y, "Progresso Geral");
  doc.setFillColor(...C.light); doc.roundedRect(20, y, 170, 12, 3, 3, "F");
  doc.setFillColor(...C.primary); doc.roundedRect(20, y, Math.max(170 * pct / 100, 0), 12, 3, 3, "F");
  doc.setTextColor(...C.white); doc.setFontSize(11); doc.setFont("helvetica", "bold");
  doc.text(pct.toFixed(0) + "%", 105, y + 8, { align: "center" });
  y += 18;

  // Grafico de barras por grupo
  const grupos = v.gruposChecklist.map(g => {
    const items = v.checklist.filter(c => c.grupo === g);
    const gDone = items.filter(i => i.done).length;
    return { label: g, value: items.length, done: gDone };
  }).filter(g => g.value > 0);

  if (grupos.length > 0) {
    y = cp(doc, y, 20 + grupos.length * 14); y = sec(doc, y, "Progresso por Grupo — Grafico");
    const maxGrp = Math.max(...grupos.map(g => g.value), 1);
    const barH = 8;
    grupos.forEach((g, i) => {
      const by = y + i * (barH + 6);
      doc.setTextColor(...C.dark); doc.setFontSize(8); doc.setFont("helvetica", "normal");
      doc.text(g.label, 15, by + barH / 2 + 1.5);
      // Background
      doc.setFillColor(...C.light); doc.roundedRect(55, by, 120, barH, 2, 2, "F");
      // Done
      const bw = maxGrp > 0 ? (g.done / maxGrp) * 120 : 0;
      doc.setFillColor(...C.primary); doc.roundedRect(55, by, Math.max(bw, 0), barH, 2, 2, "F");
      // Text
      doc.setTextColor(...C.dark); doc.setFontSize(7); doc.setFont("helvetica", "bold");
      doc.text(g.done + "/" + g.value, 180, by + barH / 2 + 1.5, { align: "right" });
    });
    y += grupos.length * (barH + 6) + 8;
  }

  // Detalhes por grupo
  v.gruposChecklist.forEach(grupo => {
    const items = v.checklist.filter(c => c.grupo === grupo);
    if (items.length === 0) return;
    y = cp(doc, y, 20 + items.length * 6); y = sec(doc, y, grupo);
    autoTable(doc, { ...tbl(y), head: [["Status", "Item", "Urgente"]],
      body: items.map(i => [i.done ? "OK" : "Pendente", i.titulo, i.urgente ? "SIM" : ""]) });
    y = (doc as any).lastAutoTable.finalY + 6;
  });

  doc.save("checklist_" + sn(v.destino) + ".pdf");
}

// ========== RELATORIO PROFISSIONAL ==========
export function gerarPDFProfissional(v: Viagem) {
  const doc = mkPDF(); hdr(doc, "Relatorio Profissional", v); ftr(doc);
  let y = 42;
  y = summaryCards(doc, y, v);

  const g = totalGasto(v), r = totalReceita(v);
  const cats = gastosPorCategoria(v);

  // Grafico barras
  if (cats.length > 0) {
    y = cp(doc, y, 80); y = sec(doc, y, "Gastos por Categoria — Grafico");
    const barData = cats.slice(0, 8).map(({ categoria: c, total: t }, i) => ({
      label: c.nome, value: t, color: C.palette[i % C.palette.length],
    }));
    drawBarChart(doc, 15, y, 180, 50, barData);
    y += 58;
  }

  // Grafico pizza
  if (cats.length > 0) {
    y = cp(doc, y, 70); y = sec(doc, y, "Composicao de Gastos — Grafico Pizza");
    const pieData = cats.slice(0, 6).map(({ categoria: c, total: t }, i) => ({
      label: c.nome, value: t, color: C.palette[i % C.palette.length],
    }));
    drawPieChart(doc, 75, y + 30, 25, pieData);
    y += 65;
  }

  // Grafico de custo por dia
  const dailyCosts = v.dias.map(d => ({
    label: fmtDataCurta(d.data),
    value: d.atividades.reduce((s, a) => s + a.custo, 0),
  }));
  if (dailyCosts.some(d => d.value > 0)) {
    y = cp(doc, y, 70); y = sec(doc, y, "Custo Diario — Grafico de Linha");
    drawLineChart(doc, 15, y, 180, 45, dailyCosts);
    y += 55;
  }

  // Itinerario
  y = cp(doc, y, 30); y = sec(doc, y, "Itinerario");
  v.dias.forEach((d, idx) => {
    y = cp(doc, y, 20); doc.setTextColor(...C.dark); doc.setFontSize(10); doc.setFont("helvetica", "bold");
    doc.text(fmtDataCurta(d.data) + " - Dia " + (idx + 1), 20, y); y += 5;
    if (d.atividades.length > 0) {
      autoTable(doc, { ...tbl(y), head: [["Hora", "Atividade", "Local", "Custo"]],
        body: d.atividades.map(a => [a.hora, a.titulo, a.local, a.custo > 0 ? fmtMoney(a.custo) : "-"]),
        columnStyles: { 3: { halign: "right" } } });
      y = (doc as any).lastAutoTable.finalY + 4;
    }
  });

  // Mapa da Rota
  const allCoords: Coord[] = v.dias.flatMap((d) => d.atividades.filter((a) => a.coord).map((a) => a.coord!));
  if (allCoords.length >= 2) {
    y = cp(doc, y, 80); y = sec(doc, y, "Mapa da Rota Percorrida");
    const lats = allCoords.map((c) => c.lat);
    const lngs = allCoords.map((c) => c.lng);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    const padLat = (maxLat - minLat) * 0.15 || 0.01;
    const padLng = (maxLng - minLng) * 0.15 || 0.01;
    const mapX = 15, mapY = y, mapW = 180, mapH = 80;

    doc.setFillColor(...C.light);
    doc.roundedRect(mapX, mapY, mapW, mapH, 3, 3, "F");
    doc.setDrawColor(...C.muted);
    doc.roundedRect(mapX, mapY, mapW, mapH, 3, 3, "S");

    const toMapX = (lng: number) => mapX + ((lng - (minLng - padLng)) / ((maxLng - minLng) + 2 * padLng)) * mapW;
    const toMapY = (lat: number) => mapY + mapH - ((lat - (minLat - padLat)) / ((maxLat - minLat) + 2 * padLat)) * mapH;

    let markerIdx = 1;
    v.dias.forEach((dia, dayIdx) => {
      const dayCoords = dia.atividades.filter((a) => a.coord).map((a) => a.coord!);
      if (dayCoords.length === 0) return;
      const color = DAY_COLORS_RGB[dayIdx % DAY_COLORS_RGB.length];

      if (dayCoords.length > 1) {
        doc.setDrawColor(...color);
        doc.setLineWidth(0.8);
        for (let i = 0; i < dayCoords.length - 1; i++) {
          doc.line(toMapX(dayCoords[i].lng), toMapY(dayCoords[i].lat), toMapX(dayCoords[i + 1].lng), toMapY(dayCoords[i + 1].lat));
        }
      }

      dayCoords.forEach((c) => {
        const cx = toMapX(c.lng);
        const cy = toMapY(c.lat);
        doc.setFillColor(...color);
        doc.circle(cx, cy, 2.2, "F");
        doc.setFillColor(...C.white);
        doc.setFontSize(5);
        doc.setFont("helvetica", "bold");
        doc.text(String(markerIdx), cx, cy + 0.5, { align: "center" });
        markerIdx++;
      });
    });

    let legendY = mapY + mapH + 5;
    v.dias.forEach((dia, dayIdx) => {
      const dayCoords = dia.atividades.filter((a) => a.coord).length;
      if (dayCoords === 0) return;
      const color = DAY_COLORS_RGB[dayIdx % DAY_COLORS_RGB.length];
      doc.setFillColor(...color);
      doc.circle(mapX + 3, legendY, 2, "F");
      doc.setTextColor(...C.dark);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text(`Dia ${dayIdx + 1} — ${fmtDataCurta(dia.data)} (${dayCoords} locais)`, mapX + 8, legendY + 0.8);
      legendY += 4;
    });

    doc.setTextColor(...C.muted);
    doc.setFontSize(7);
    doc.text(allCoords.length + " locais mapeados", mapX, legendY + 2);

    y = legendY + 8;
  }

  // Lancamentos
  y = cp(doc, y, 40); y = sec(doc, y, "Lancamentos Financeiros");
  autoTable(doc, { ...tbl(y), head: [["Data", "Tipo", "Descricao", "Categoria", "Valor"]],
    body: v.lancamentos.map(l => { const c = v.categorias.find(x => x.id === l.categoriaId); return [l.data, l.tipo === "despesa" ? "Despesa" : "Receita", l.descricao, c?.nome ?? "-", fmtMoney(l.valor)]; }),
    columnStyles: { 4: { halign: "right" } } });
  y = (doc as any).lastAutoTable.finalY + 8;

  // Checklist com grafico
  const done = v.checklist.filter(c => c.done).length;
  y = cp(doc, y, 30); y = sec(doc, y, "Checklist");
  const pct = v.checklist.length > 0 ? (done / v.checklist.length) * 100 : 0;
  doc.setFillColor(...C.light); doc.roundedRect(20, y, 170, 10, 3, 3, "F");
  doc.setFillColor(...C.primary); doc.roundedRect(20, y, Math.max(170 * pct / 100, 0), 10, 3, 3, "F");
  doc.setTextColor(...C.white); doc.setFontSize(10); doc.setFont("helvetica", "bold");
  doc.text(done + "/" + v.checklist.length + " (" + pct.toFixed(0) + "%)", 105, y + 7, { align: "center" });
  y += 16;

  v.gruposChecklist.forEach(grupo => {
    const items = v.checklist.filter(c => c.grupo === grupo);
    if (items.length === 0) return;
    y = cp(doc, y, 10 + items.length * 5);
    doc.setTextColor(...C.dark); doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.text(grupo, 20, y); y += 5;
    items.forEach(i => {
      doc.setFont("helvetica", "normal"); doc.setFontSize(8);
      doc.text("[" + (i.done ? "X" : " ") + "] " + (i.urgente ? "! " : "") + i.titulo, 25, y); y += 4;
    });
    y += 3;
  });

  doc.save("relatorio_profissional_" + sn(v.destino) + ".pdf");
}

export function imprimirPDF(v: Viagem) { gerarPDFProfissional(v); }
