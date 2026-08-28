import { useTrip } from "@/context/TripContext";
import { Header } from "@/components/Header";
import { totalGasto, totalReceita, saldo, fmtMoney, limparNomeViagem } from "@/utils/helpers";
import {
  gerarPDFGeral,
  gerarPDFFinanceiro,
  gerarPDFAtividades,
  gerarPDFViajantes,
  gerarPDFChecklist,
  gerarPDFProfissional,
} from "@/utils/pdf";
import {
  exportarRelatorioGeral,
  exportarRelatorioFinanceiro,
  exportarFinanceiroCSV,
  exportarRelatorioAtividades,
  exportarRelatorioViajantes,
  exportarRelatorioChecklist,
  exportarJSON,
} from "@/utils/reports";

const pdfReports = [
  { id: "pdf-geral", nome: "Relatório Geral", descricao: "Resumo completo da viagem em PDF", icone: "📋", action: gerarPDFGeral },
  { id: "pdf-financeiro", nome: "Relatório Financeiro", descricao: "Despesas, receitas e categorias", icone: "💰", action: gerarPDFFinanceiro },
  { id: "pdf-atividades", nome: "Relatório de Atividades", descricao: "Roteiro completo com custos", icone: "🗓️", action: gerarPDFAtividades },
  { id: "pdf-viajantes", nome: "Relatório por Viajante", descricao: "Gastos individuais de cada viajante", icone: "👥", action: gerarPDFViajantes },
  { id: "pdf-checklist", nome: "Relatório de Checklist", descricao: "Status de preparação da viagem", icone: "✅", action: gerarPDFChecklist },
  { id: "pdf-profissional", nome: "Relatório Profissional", descricao: "Documento completo e formatado", icone: "📄", action: gerarPDFProfissional },
];

const otherReports = [
  { id: "txt-geral", nome: "Geral (TXT)", descricao: "Texto simples", icone: "📝", action: exportarRelatorioGeral },
  { id: "txt-financeiro", nome: "Financeiro (TXT)", descricao: "Detalhamento em texto", icone: "📝", action: exportarRelatorioFinanceiro },
  { id: "csv", nome: "Financeiro (CSV)", descricao: "Planilha para Excel", icone: "📊", action: exportarFinanceiroCSV },
  { id: "txt-atividades", nome: "Atividades (TXT)", descricao: "Roteiro em texto", icone: "📝", action: exportarRelatorioAtividades },
  { id: "txt-viajantes", nome: "Viajantes (TXT)", descricao: "Gastos por viajante", icone: "📝", action: exportarRelatorioViajantes },
  { id: "txt-checklist", nome: "Checklist (TXT)", descricao: "Status em texto", icone: "📝", action: exportarRelatorioChecklist },
  { id: "json", nome: "Backup (JSON)", descricao: "Dados completos", icone: "💾", action: exportarJSON },
];

export default function ReportsPage() {
  const { viagem } = useTrip();
  const gastos = totalGasto(viagem);
  const receitas = totalReceita(viagem);
  const saldoVal = saldo(viagem);

  return (
    <div>
      <Header title="Relatórios" subtitle={limparNomeViagem(viagem.destino)} />

      <div className="mx-auto max-w-4xl space-y-6 p-4 md:px-6">
        {/* Resumo */}
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-3">{limparNomeViagem(viagem.destino)}</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <p className="text-text-muted text-xs">Orçamento</p>
              <p className="text-sm font-bold">{fmtMoney(viagem.orcamento)}</p>
            </div>
            <div>
              <p className="text-text-muted text-xs">Gastos</p>
              <p className="text-sm font-bold text-red-500">{fmtMoney(gastos)}</p>
            </div>
            <div>
              <p className="text-text-muted text-xs">Receitas</p>
              <p className="text-sm font-bold text-green-600">{fmtMoney(receitas)}</p>
            </div>
            <div>
              <p className="text-text-muted text-xs">Saldo</p>
              <p className={`text-sm font-bold ${saldoVal >= 0 ? "text-green-600" : "text-red-500"}`}>{fmtMoney(saldoVal)}</p>
            </div>
          </div>
        </div>

        {/* PDFs */}
        <div>
          <h2 className="text-base font-semibold mb-1">Relatórios em PDF</h2>
          <p className="text-text-muted text-xs mb-3">Documentos profissionais formatados e prontos para impressão</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pdfReports.map((r) => (
              <button
                key={r.id}
                onClick={() => r.action(viagem)}
                className="bg-surface group flex items-start gap-3 rounded-xl border border-border p-4 text-left transition-all hover:border-primary/30 hover:shadow-sm"
              >
                <span className="text-2xl">{r.icone}</span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold group-hover:text-primary transition-colors">{r.nome}</h3>
                  <p className="text-text-muted mt-0.5 text-xs">{r.descricao}</p>
                </div>
                <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-[10px] font-bold">PDF</span>
              </button>
            ))}
          </div>
        </div>

        {/* Outros formatos */}
        <div>
          <h2 className="text-base font-semibold mb-1">Outros Formatos</h2>
          <p className="text-text-muted text-xs mb-3">Exportações em texto, planilha e backup</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {otherReports.map((r) => (
              <button
                key={r.id}
                onClick={() => r.action(viagem)}
                className="bg-surface group flex items-start gap-3 rounded-xl border border-border p-4 text-left transition-all hover:border-primary/30 hover:shadow-sm"
              >
                <span className="text-2xl">{r.icone}</span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold group-hover:text-primary transition-colors">{r.nome}</h3>
                  <p className="text-text-muted mt-0.5 text-xs">{r.descricao}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Dicas */}
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-sm font-semibold mb-2">Dicas</h3>
          <ul className="text-text-muted space-y-1 text-xs">
            <li>• Os <strong>PDFs</strong> já vêm formatados — basta salvar ou imprimir</li>
            <li>• Para salvar como PDF, use Ctrl+P e selecione "Salvar como PDF"</li>
            <li>• O <strong>CSV</strong> pode ser aberto no Excel ou Google Planilhas</li>
            <li>• O <strong>JSON</strong> serve como backup completo dos dados</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
