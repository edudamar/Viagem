import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

type HeaderProps = {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  actions?: React.ReactNode;
};

export function Header({ title, subtitle, showBack, actions }: HeaderProps) {
  const navigate = useNavigate();
  return (
    <div className="bg-surface/80 border-border sticky top-0 z-30 flex items-center gap-3 border-b px-4 py-3 backdrop-blur-md md:px-6">
      {showBack && (
        <button onClick={() => navigate(-1)} className="text-text-muted hover:text-text -ml-1 p-1">
          <ArrowLeft className="h-5 w-5" />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg font-semibold">{title}</h1>
        {subtitle && <p className="text-text-muted truncate text-xs">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
