
import Sidebar from "./Sidebar";
import "../../styles/components/MainLayout.css";

function MainLayout({ currentPage, onNavigate, onLogout, children }) {
  return (
    <div className="oism-app-layout">
      <Sidebar
        currentPage={currentPage}
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

      <main className="oism-content">
        {children}
      </main>
    </div>
  );
}

export default MainLayout;
