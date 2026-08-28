import { Calendar, Wallet, TrendingUp, TrendingDown, MapPin, Clock, DollarSign, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useTrip } from "@/context/TripContext";
import { Header } from "@/components/Header";
import { diasAte, totalGasto, totalReceita, saldo, fmtMoney, fmtDataCurta, gastosPorCategoria, limparNomeViagem } from "@/utils/helpers";

export default function DashboardPage() {
  const { viagem } = useTrip();
  const dias = diasAte(viagem.inicio);
  const totalDias = Math.round(
    (new Date(viagem.fim + "T00:00:00").getTime() - new Date(viagem.inicio + "T00:00:00").getTime()) / 86400000,
  ) + 1;
  const gastos = totalGasto(viagem);
  const receitas = totalReceita(viagem);
  const saldoVal = saldo(viagem);
  const pctOrcamento = viagem.orcamento > 0 ? (gastos / viagem.orcamento) * 100 : 0;
  const categorias = gastosPorCategoria(viagem);
  const maxCat = Math.max(...categorias.map((c) => c.total), 1);

  return (
    <div>
      <Header title="Painel" subtitle={limparNomeViagem(viagem.destino)} />

      <div className="mx-auto max-w-4xl space-y-4 p-4 md:px-6">
        {/* Countdown */}
        <div className="bg-gradient-to-br from-primary to-primary-dark rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="h-5 w-5 opacity-80" />
            <h2 className="text-xl font-bold">{limparNomeViagem(viagem.destino)}</h2>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold">{dias > 0 ? dias : 0}</div>
              <div className="text-white/70 text-xs">{dias > 0 ? "dias restantes" : "em andamento"}</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{totalDias}</div>
              <div className="text-white/70 text-xs">dias totais</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{viagem.dias.length}</div>
              <div className="text-white/70 text-xs">com atividades</div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm opacity-80">
            <Calendar className="h-4 w-4" />
            {fmtDataCurta(viagem.inicio)} — {fmtDataCurta(viagem.fim)}
          </div>
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="bg-surface rounded-xl border border-border p-4">
            <div className="text-text-muted flex items-center gap-2 text-xs">
              <Wallet className="h-3.5 w-3.5" />
              Orçamento
            </div>
            <div className="mt-1 text-lg font-bold">{fmtMoney(viagem.orcamento)}</div>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4">
            <div className="text-text-muted flex items-center gap-2 text-xs">
              <TrendingDown className="h-3.5 w-3.5" />
              Gastos
            </div>
            <div className="mt-1 text-lg font-bold text-red-500">{fmtMoney(gastos)}</div>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4">
            <div className="text-text-muted flex items-center gap-2 text-xs">
              <TrendingUp className="h-3.5 w-3.5" />
              Receitas
            </div>
            <div className="mt-1 text-lg font-bold text-green-600">{fmtMoney(receitas)}</div>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4">
            <div className="text-text-muted flex items-center gap-2 text-xs">
              <DollarSign className="h-3.5 w-3.5" />
              Saldo
            </div>
            <div className={`mt-1 text-lg font-bold ${saldoVal >= 0 ? "text-green-600" : "text-red-500"}`}>
              {fmtMoney(saldoVal)}
            </div>
          </div>
        </div>

        {/* Barra de orçamento */}
        <div className="bg-surface rounded-xl border border-border p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium">Uso do orçamento</span>
            <span className="text-text-muted text-xs">{pctOrcamento.toFixed(0)}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full rounded-full transition-all ${pctOrcamento > 100 ? "bg-red-500" : pctOrcamento > 80 ? "bg-amber-400" : "bg-primary"}`}
              style={{ width: `${Math.min(pctOrcamento, 100)}%` }}
            />
          </div>
          <div className="text-text-muted mt-1 flex justify-between text-xs">
            <span>{fmtMoney(gastos)} gastos</span>
            <span>{fmtMoney(viagem.orcamento - gastos)} restante</span>
          </div>
        </div>

        {/* Gastos por categoria */}
        {categorias.length > 0 && (
          <div className="bg-surface rounded-xl border border-border p-4">
            <h3 className="mb-3 text-sm font-medium">Gastos por Categoria</h3>
            <div className="space-y-3">
              {categorias.map(({ categoria, total }) => (
                <div key={categoria.id}>
                  <div className="mb-1 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: categoria.cor }} />
                      <span className="text-xs">{categoria.nome}</span>
                    </div>
                    <span className="text-xs font-medium">{fmtMoney(total)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${(total / maxCat) * 100}%`, backgroundColor: categoria.cor }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Atividades recentes */}
        {viagem.dias.length > 0 && (
          <div className="bg-surface rounded-xl border border-border p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-medium">Próximas Atividades</h3>
              <Link to={`/${viagem.id}/itinerario`} className="text-primary flex items-center gap-1 text-xs font-medium">
                Ver roteiro <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {viagem.dias
                .flatMap((d) => d.atividades.map((a) => ({ ...a, data: d.data })))
                .slice(0, 4)
                .map((a) => (
                  <div key={a.id} className="flex items-center gap-3 rounded-lg bg-gray-50 p-2.5">
                    <div className="bg-primary/10 flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg">
                      <Clock className="text-primary h-3 w-3" />
                      <span className="text-primary text-[9px] font-semibold">{a.hora}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{a.titulo}</p>
                      <p className="text-text-muted truncate text-xs">{a.local}</p>
                    </div>
                    {a.custo > 0 && <span className="text-xs font-medium">{fmtMoney(a.custo)}</span>}
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
