import type React from "react";
import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import Jadwal from "./pages/Jadwal";
import AssignWorker from "./pages/AssignWorker";
import Login from "./pages/Login";
import Register from "./pages/Register";

import { LogOut } from "lucide-react";
import logo from "./assets/logo_small.png";

type Page = "dashboard" | "assign" | "jadwal" | "login" | "register";

function App(): React.JSX.Element {
  const [currentPage, setCurrentPage] = useState<Page>("login");

  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  const handleAuthSuccess = (role: string) => {
    setCurrentUserRole(role);
    setCurrentPage("dashboard");
  };

  const handleAuthNavigate = (page: "login" | "register") => {
    setCurrentUserRole(null);
    setCurrentPage(page);
  };

  const handleLogout = () => {
    setCurrentUserRole(null);
    setCurrentPage("login");
  };

  const goToDashboard = () => {
    setCurrentPage("dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="bg-white shadow-sm border-b-2 border-blue-600">
        <div className=" mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            {/* 🔹 Logo + Nama App */}
            <div className="flex items-center gap-3">
              <img
                src={logo}
                alt="ABADI Comm Logo"
                className="w-10 h-10 object-contain"
              />
              <h1 className="text-2xl font-bold text-blue-600">
                ABADI Comm
              </h1>
            </div>

            {/* 🔹 Tombol Aksi (Fixed: Now conditional) */}
            {currentPage !== "login" && currentPage !== "register" && (
              <div className="flex items-center gap-4">

                {currentUserRole === '3' && (
                  <button
                    onClick={() => setCurrentPage("register")}
                    className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-100 transition"
                  >
                    Register Worker
                  </button>
                )}

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            )}

          </div>
        </div>
      </header>

      {currentPage !== "login" && currentPage !== "register" && (
        <nav className="flex items-center justify-between bg-gray-50 border-b border-gray-200 px-8 py-4 shadow-sm mx-auto">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setCurrentPage("dashboard")}
              className={`text-sm font-medium transition ${
                currentPage === "dashboard"
                  ? "text-blue-600"
                  : "text-gray-700 hover:text-blue-600"
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setCurrentPage("assign")}
              className={`text-sm font-medium transition ${
                currentPage === "assign"
                  ? "text-blue-600"
                  : "text-gray-700 hover:text-blue-600"
              }`}
            >
              Assign Worker
            </button>

            <button
              onClick={() => setCurrentPage("jadwal")}
              className={`text-sm font-medium transition ${
                currentPage === "jadwal"
                  ? "text-blue-600"
                  : "text-gray-700 hover:text-blue-600"
              }`}
            >
              Schedule
            </button>
          </div>
        </nav>
      )}

      {/* 🔹 Konten Utama */}
      <main className=" mx-auto py-6 sm:px-6 lg:px-8">
        {currentPage === "dashboard" && <Dashboard />}
        {currentPage === "assign" && <AssignWorker />}
        {currentPage === "jadwal" && <Jadwal />}

        {currentPage === "login" && (
          <Login
            onAuthSuccess={handleAuthSuccess}
            onNavigate={handleAuthNavigate}
          />
        )}
        {currentPage === "register" && (
          <Register
            onNavigate={handleAuthNavigate}
            onCancel={goToDashboard}
            isAdminRegistering={currentUserRole === '3'}
          />
        )}
      </main>
    </div>
  );
}

export default App;
