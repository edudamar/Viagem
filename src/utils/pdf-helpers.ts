import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Viagem } from "@/types";
import { totalGasto, totalReceita, saldo, gastosPorCategoria, fmtMoney, fmtDataCurta, parteDoViajante, limparNomeViagem } from "./helpers";

const C = {
  primary: [13, 148, 136] as [number, number, number],
  dark: [15, 23, 42] as [number, number, number],
  muted: [100, 116, 139] as [number, number, number],
  light: [241, 245, 249] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  red: [225, 29, 72] as [number, number, number],
  green: [22, 163, 74] as [number, number, number],
};

function sanitize(n: string) { return n.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase(); }

function addHeader(doc: jsPDF, title: string, v: Viagem) {
  doc.setFillColor(...C.primary);
  doc.rect(0, 0, 210, 35, "F");
  doc.setTextColor(...C.white);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(title, 20, 18);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(limparNomeViagem(v.destino) + "  |  " + fmtDataCurta(v.inicio) + " a " + fmtDataCurta(v.fim), 20, 26);
  doc.setFontSize(8);
  doc.text("Gerado em " + new Date().toLocaleDateString("pt-BR"), 20, 32);
}

function addFooter(doc: jsPDF, page: number) {
  const h = doc.internal.pageSize.getHeight();
  doc.setFillColor(...C.light);
  doc.rect(0, h - 12, 210, 12, "F");
  doc.setTextColor(...C.muted);
  doc.setFontSize(7);
  doc.text("Meu Roteiro de Viagem", 20, h - 7);
  doc.text("Pagina " + page, 190, h - 7, { align: "right" });
}

function sectionTitle(doc: jsPDF, y: number, title: string) {
  doc.setFillColor(...C.primary);
  doc.roundedRect(15, y, 180, 8, 2, 2, "F");
  doc.setTextColor(...C.white);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(title, 20, y + 5.5);
  return y + 14;
}

function checkPage(doc: jsPDF, y: number, need: number) {
  if (y + need > doc.internal.pageSize.getHeight() - 20) { doc.addPage(); addFooter(doc, doc.getNumberOfPages()); return 20; }
  return y;
}
