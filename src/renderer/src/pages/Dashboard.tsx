"use client"

import { useEffect, useState } from "react"
import { ChevronRight, Plus } from "lucide-react"

interface DashboardProps {
  onNavigate?: (page: string) => void
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [workers, setWorkers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (window.electronAPI?.getWorkers) {
      window.electronAPI.getWorkers()
        .then((data: any) => {
          setWorkers(data)
          setIsLoading(false)
        })
        .catch((error: any) => {
          console.error("Error fetching workers:", error)
          setIsLoading(false)
        })
    } else {
      // Mock data for testing
      setTimeout(() => {
        setWorkers([
          { id: "1", name: "John Doe", status: "Active" },
          { id: "2", name: "Jane Smith", status: "Active" },
          { id: "3", name: "Mike Johnson", status: "On Leave" },
          { id: "4", name: "Sarah Williams", status: "Active" },
        ])
        setIsLoading(false)
      }, 500)
    }
  }, [])

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <div className="flex h-[calc(100vh-73px)]">
        {/* Sidebar */}
        <div className="w-64 border-r border-gray-200 bg-gray-50 p-6 space-y-4">
          <button
            onClick={() => onNavigate?.("assign")}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[#E63946] hover:bg-[#d62828] transition text-white font-semibold"
          >
            <Plus size={18} />
            Assign Worker
          </button>

          <div className="pt-4 border-t border-gray-300 space-y-3">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Quick Links</p>
            <button
              onClick={() => onNavigate?.("assign")}
              className="block w-full text-left text-sm text-gray-600 hover:text-[#0066FF] transition"
            >
              Assign Workers
            </button>
            <a href="#" className="block text-sm text-gray-600 hover:text-[#0066FF] transition">
              Schedule
            </a>
            <a href="#" className="block text-sm text-gray-600 hover:text-[#0066FF] transition">
              Reports
            </a>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-8 space-y-6">
            <div>
              <h2 className="text-3xl font-bold mb-2 text-gray-900">Weekly Schedule</h2>
              <p className="text-gray-600">Manage and view worker assignments for this week</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition border-l-4 border-l-[#0066FF]">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Worker ID</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Name</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                          Loading workers...
                        </td>
                      </tr>
                    ) : workers.length > 0 ? (
                      workers.map((worker, idx) => (
                        <tr key={idx} className="border-b border-gray-200 hover:bg-blue-50 transition">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">#{worker.id}</td>
                          <td className="px-6 py-4 text-sm text-gray-700">{worker.name}</td>
                          <td className="px-6 py-4 text-sm">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                worker.status === "Active" ? "bg-blue-100 text-[#0066FF]" : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {worker.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <button className="text-[#0066FF] hover:text-[#0052cc] transition flex items-center gap-1 font-medium">
                              View <ChevronRight size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                          No workers found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-600">Showing {workers.length} workers</p>
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E63946] hover:bg-[#d62828] transition text-white text-sm font-medium">
                  See More <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <StatCard label="Total Workers" value={workers.length} />
              <StatCard label="Active Today" value={workers.filter((w) => w.status === "Active").length} />
              <StatCard label="On Leave" value={workers.filter((w) => w.status === "On Leave").length} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-[#0066FF] hover:shadow-md transition">
      <p className="text-sm text-gray-600 mb-2">{label}</p>
      <p className="text-3xl font-bold text-[#0066FF]">{value}</p>
    </div>
  )
}
