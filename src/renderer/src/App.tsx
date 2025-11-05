"use client"

import type React from "react"

import { useState } from "react"
import Dashboard from "./pages/Dashboard"
import AssignWorker from "./pages/AssignWorker"
import Versions from "./components/Versions"
import { LogOut } from "lucide-react"
import logo from "./assets/electron.svg"

function App(): React.JSX.Element {
  const [currentPage, setCurrentPage] = useState("dashboard")

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="bg-white shadow-sm border-b-2 border-blue-600">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <img
                src={logo}
                alt="ABADI Comm Logo"
                className="w-10 h-10 object-contain"
              />
              <h1 className="text-2xl font-bold text-blue-600">ABADI Comm</h1>

            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentPage("assign")}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-100 transition"
              >
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

      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage("dashboard")}
              className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                currentPage === "dashboard"
                  ? "text-blue-600 border-blue-600"
                  : "text-gray-600 border-transparent hover:text-blue-600"
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setCurrentPage("assign")}
              className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                currentPage === "assign"
                  ? "text-blue-600 border-blue-600"
                  : "text-gray-600 border-transparent hover:text-blue-600"
              }`}
            >
              Assign Worker
            </button>
            <button
              onClick={() => setCurrentPage("versions")}
              className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                currentPage === "versions"
                  ? "text-blue-600 border-blue-600"
                  : "text-gray-600 border-transparent hover:text-blue-600"
              }`}
            >
              Versions
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {currentPage === "dashboard" && <Dashboard onNavigate={setCurrentPage} />}
        {currentPage === "assign" && <AssignWorker />}
        {currentPage === "versions" && <Versions />}
      </main>
    </div>
  )
}

export default App
