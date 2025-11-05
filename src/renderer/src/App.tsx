import type React from "react";
import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import Versions from "./components/Versions";
import { LogOut } from "lucide-react";
import logo from "./assets/electron.svg"; // pastikan file logo ada di src/assets/

function App(): React.JSX.Element {
  const [currentPage, setCurrentPage] = useState("dashboard");

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="bg-white shadow-sm border-b-2 border-blue-600">
        <div className="max-w-7xl mx-auto px-6 py-4">
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
              <button className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-100 transition">
                Register Worker
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition">
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 🔹 Konten Utama */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {currentPage === "dashboard" && <Dashboard />}
        {currentPage === "versions" && <Versions />}
      </main>
    </div>
  );
}

export default App;
