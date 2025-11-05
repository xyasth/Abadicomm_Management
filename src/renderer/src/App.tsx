import type React from "react";
import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import LoginRegister from "./pages/LoginRegister";
import AssignWorker from "./pages/AssignWorker";
import Versions from "./components/Versions";

import { LogOut } from "lucide-react";
import logo from "./assets/electron.svg";

type Page = "dashboard" | "assign" | "login" | "register" | "versions";

function App(): React.JSX.Element {
  const [currentPage, setCurrentPage] = useState<Page>("login");

  const handleAuthSuccess = () => {
    setCurrentPage("dashboard");
  };

  const handleAuthNavigate = (page: "login" | "register") => {
    setCurrentPage(page);
  };

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

            {/* 🔹 Tombol Aksi */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentPage("register")}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-100 transition"
              >
                Register Worker
              </button>
              <button
                onClick={() => setCurrentPage("login")}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {currentPage !== "login" && currentPage !== "register" && (
        <nav className="flex items-center justify-between bg-gray-50 border-b border-gray-200 px-8 py-4 shadow-sm max-w-7xl mx-auto">
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
          </div>
        </nav>
      )}

      {/* 🔹 Konten Utama */}
      <main className=" mx-auto py-6 sm:px-6 lg:px-8">
        {currentPage === "dashboard" && <Dashboard />}
        {currentPage === "assign" && <AssignWorker />}

        {currentPage === "login" && (
          <LoginRegister
            initialMode="login"
            onAuthSuccess={handleAuthSuccess}
            onNavigate={handleAuthNavigate}
          />
        )}
        {currentPage === "register" && (
          <LoginRegister
            initialMode="register"
            onAuthSuccess={handleAuthSuccess}
            onNavigate={handleAuthNavigate}
          />
        )}
      </main>
    </div>
  );
}

export default App;
