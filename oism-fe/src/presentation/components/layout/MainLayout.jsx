import { useState } from "react";
import Sidebar from "./Sidebar";
import StoreInfoModal from "@/presentation/components/modals/StoreInfoModal";
import ChangePasswordModal from "@/presentation/components/modals/ChangePasswordModal";
import "@/presentation/styles/MainLayout.css";

function MainLayout({ currentPage, onNavigate, onLogout, children }) {
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  return (
    <div className="oism-app-layout">
      <Sidebar
        currentPage={currentPage}
        onNavigate={onNavigate}
        onLogout={onLogout}
        onOpenStoreModal={() => setIsStoreModalOpen(true)}
        onOpenPasswordModal={() => setIsPasswordModalOpen(true)}
      />
      <main className="oism-content">{children}</main>

      <StoreInfoModal
        isOpen={isStoreModalOpen}
        onClose={() => setIsStoreModalOpen(false)}
      />
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
}

export default MainLayout;