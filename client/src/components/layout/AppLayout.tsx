import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";

export const AppLayout = () => (
  <div className="flex h-screen overflow-hidden bg-gray-50">
    <Sidebar />
    {/* pt-14 offsets the fixed mobile top bar; md:pt-0 removes it on desktop */}
    <main className="flex-1 overflow-y-auto p-4 pt-[72px] md:p-8 md:pt-8">
      <Outlet />
    </main>
  </div>
);
