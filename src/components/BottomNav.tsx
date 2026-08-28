import { NavLink } from "react-router-dom";
import { Home, LayoutDashboard, Map, DollarSign, CheckSquare, FileText, Settings } from "lucide-react";
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

export function BottomNav({ base }: { base: string }) {
  return (
    <nav className="bg-surface border-t-border fixed bottom-0 left-0 right-0 z-40 border-t md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="mx-auto flex max-w-lg items-center justify-around px-1 py-1.5">
        {links.map((link) => {
          const path = link.home ? "/" : `${base}${link.to}`;
          return (
            <NavLink
              key={link.to}
              to={path}
              end={link.home}
              className={({ isActive }) =>
                cn(
                  "flex min-w-0 flex-1 flex-col items-center gap-px px-0.5 py-1 text-[9px] font-medium transition-colors",
                  isActive ? "text-primary" : "text-text-muted",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <link.icon className={cn("h-4.5 w-4.5 shrink-0", isActive && "fill-primary/10")} />
                  <span className="truncate w-full text-center leading-tight">{link.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
