import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

const DashboardLayout = () => {
  const [showSidebar, setShowSidebar] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar show={showSidebar} onLinkClick={() => setShowSidebar(false)} />

      <div className="main-content">
        <Topbar onToggleSidebar={() => setShowSidebar((s) => !s)} />
        <main className="p-3 p-md-4">
          <Outlet />
        </main>
      </div>

      {/* Mobile overlay - click to close sidebar */}
      {showSidebar && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100"
          style={{ background: "rgba(0,0,0,0.4)", zIndex: 1030 }}
          onClick={() => setShowSidebar(false)}
        ></div>
      )}
    </div>
  );
};

export default DashboardLayout;
