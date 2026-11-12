
import Sidebar from "./Sidebar";
import "../../styles/components/MainLayout.css";

function MainLayout({ currentPage, onNavigate, children }) {
  return (
    <div className="oism-app-layout">
      <Sidebar
        currentPage={currentPage}
        onNavigate={onNavigate}
      />

      <main className="oism-content">
        {children}
      </main>
    </div>
  );
}

export default MainLayout;
