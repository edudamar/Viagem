import { NavLink } from "react-router-dom";
import { Home, LayoutDashboard, Map, DollarSign, CheckSquare, Settings, FileText } from "lucide-react";
import { cn } from "@/utils/helpers";

const links = [
  { to: "/", icon: Home, label: "Início", home: true },
  { to: "/dashboard", icon: LayoutDashboard, label: "Painel" },
  { to: "/itinerario", icon: Map, label: "Roteiro" },
  { to: "/financas", icon: DollarSign, label: "Finanças" },
  { to: "/checklist", icon: CheckSquare, label: "Checklist" },
  { to: "/relatorios", icon: FileText, label: "Relatórios" },
  { to: "/config", icon: Settings, label: "Config" },
];

export function Sidebar({ base }: { base: string }) {
  return (
    <aside className="bg-surface border-r-border fixed left-0 top-0 z-40 hidden h-full w-56 border-r md:block">
      <div className="flex h-14 items-center px-4">
        <span className="text-primary text-lg font-bold">✈ Meu Roteiro</span>
      </div>
      <nav className="mt-2 flex flex-col gap-1 px-3">
        {links.map((link) => {
          const path = link.home ? "/" : `${base}${link.to}`;
          return (
            <NavLink
              key={link.to}
              to={path}
              end={link.home}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive ? "bg-primary/10 text-primary" : "text-text-muted hover:bg-gray-50",
                )
              }
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
