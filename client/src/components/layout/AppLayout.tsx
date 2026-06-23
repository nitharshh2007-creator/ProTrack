import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar } from "./Sidebar";
import { NotificationBell } from "./NotificationBell";
import { BackgroundOrbs } from "@/components/ui/BackgroundOrbs";
import { NotificationToasts } from "@/store/notification.store";

export const AppLayout = () => {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen relative flex">
      <Sidebar />
      <BackgroundOrbs />
      <NotificationToasts />

      <main className="flex-1 ml-[240px] transition-all duration-300">
        <div className="min-h-screen">
          <div className="sticky top-0 z-20 flex justify-end px-1 pt-1">
            <NotificationBell />
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="mx-auto max-w-[1000px] px-4 py-4"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};
