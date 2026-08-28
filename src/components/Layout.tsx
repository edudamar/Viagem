import { useEffect } from "react";
import { Outlet, useParams } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { useTrip } from "@/context/TripContext";

export function Layout() {
  const { activeId, setActiveViagem } = useTrip();
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    if (id && id !== activeId) {
      setActiveViagem(id);
    }
  }, [id, activeId, setActiveViagem]);

  const base = `/${activeId}`;

  return (
    <div className="min-h-screen">
      <Sidebar base={base} />
      <main className="pb-20 md:ml-56 md:pb-0">
        <Outlet />
      </main>
      <BottomNav base={base} />
    </div>
  );
}
