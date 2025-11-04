"use client"

import { useEffect, useState } from "react"
import { Plus, X } from "lucide-react"

interface WorkerAssignment {
  id: string
  worker: string
  jobdesc: string
  ketua: string
}

export default function AssignWorker() {
  const [workers, setWorkers] = useState<any[]>([])
  const [jobdescOptions, setJobdescOptions] = useState<string[]>([])
  const [ketuaOptions, setKetuaOptions] = useState<string[]>([])

  const [date, setDate] = useState("")
  const [location, setLocation] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")

  const [assignments, setAssignments] = useState<WorkerAssignment[]>([
    { id: "1", worker: "", jobdesc: "", ketua: "" }
  ])

  // Load data on mount
  useEffect(() => {
    if (window.electronAPI?.getWorkers) {
      window.electronAPI.getWorkers().then((data: any) => {
        setWorkers(data)
      })
    }

    if (window.electronAPI?.getJobdesc) {
      window.electronAPI.getJobdesc().then((data: string[]) => {
        setJobdescOptions(data)
      }).catch(() => {
        // Fallback to mock data
        setJobdescOptions(["Sound System", "Lighting", "Stage Manager", "MC", "Security", "Documentation"])
      })
    }

    if (window.electronAPI?.getKetua) {
      window.electronAPI.getKetua().then((data: string[]) => {
        setKetuaOptions(data)
      }).catch(() => {
        // Fallback to mock data
        setKetuaOptions(["Ahmad", "Budi", "Citra", "Dewi", "Eko", "Fani"])
      })
    }
  }, [])

  const addAssignment = () => {
    setAssignments([
      ...assignments,
      { id: Date.now().toString(), worker: "", jobdesc: "", ketua: "" }
    ])
  }

  const removeAssignment = (id: string) => {
    if (assignments.length > 1) {
      setAssignments(assignments.filter((a) => a.id !== id))
    }
  }

  const updateAssignment = (id: string, field: keyof WorkerAssignment, value: string) => {
    setAssignments(assignments.map((a) =>
      a.id === id ? { ...a, [field]: value } : a
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate that all assignments have all required fields
    const invalidAssignments = assignments.filter(a => !a.worker || !a.jobdesc || !a.ketua)
    if (invalidAssignments.length > 0) {
      alert("Please fill in all worker assignments (Worker, Jobdesc, and Ketua)")
      return
    }

    // Check for duplicate workers
    const workerNames = assignments.map(a => a.worker)
    const duplicates = workerNames.filter((name, index) => workerNames.indexOf(name) !== index)
    if (duplicates.length > 0) {
      alert(`Duplicate workers found: ${duplicates.join(", ")}. Each worker can only be assigned once per event.`)
      return
    }

    // Submit each assignment as a separate row to Google Sheets
    try {
      for (const assignment of assignments) {
        const payload = [
          assignment.worker,
          date,
          location,
          startTime,
          endTime,
          assignment.jobdesc,
          assignment.ketua,
        ]

        if (window.electronAPI?.addSchedule) {
          await window.electronAPI.addSchedule(payload)
        }
      }

      alert(`Successfully assigned ${assignments.length} worker(s)!`)

      // Reset form
      setDate("")
      setLocation("")
      setStartTime("")
      setEndTime("")
      setAssignments([{ id: "1", worker: "", jobdesc: "", ketua: "" }])
    } catch (error) {
      console.error("Error assigning workers:", error)
      alert("Failed to assign workers")
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Assign Worker</h1>
          <p className="text-gray-600">Fill in the event details and assign workers with their roles</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Event Details - Date and Location */}
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Event Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm font-semibold text-gray-700 mb-2 block">Hari Tanggal</span>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none transition bg-blue-50"
                  required
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-gray-700 mb-2 block">Tempat</span>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Enter location"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none transition bg-blue-50"
                  required
                />
              </label>
            </div>
          </div>

          {/* Event Time */}
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Event Time</h3>
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm font-semibold text-gray-700 mb-2 block">Waktu Mulai</span>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none transition bg-blue-50"
                  required
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-gray-700 mb-2 block">Waktu Berakhir</span>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none transition bg-blue-50"
                  required
                />
              </label>
            </div>
          </div>

          {/* Worker Assignments */}
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Worker Assignments</h3>
              <button
                type="button"
                onClick={addAssignment}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-sm font-medium"
              >
                <Plus size={18} />
                Add Worker
              </button>
            </div>

            {assignments.map((assignment, index) => (
              <div key={assignment.id} className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">Worker #{index + 1}</span>
                  {assignments.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeAssignment(assignment.id)}
                      className="p-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {/* Worker Dropdown */}
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700 mb-1.5 block">Worker</span>
                    <select
                      value={assignment.worker}
                      onChange={(e) => updateAssignment(assignment.id, "worker", e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none transition bg-yellow-50 font-medium"
                      required
                    >
                      <option value="">Select Worker</option>
                      {workers.map((worker) => (
                        <option key={worker.id} value={worker.name}>
                          {worker.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  {/* Jobdesc Dropdown */}
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700 mb-1.5 block">Jobdesc</span>
                    <select
                      value={assignment.jobdesc}
                      onChange={(e) => updateAssignment(assignment.id, "jobdesc", e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none transition bg-yellow-50 font-medium"
                      required
                    >
                      <option value="">Select Job Description</option>
                      {jobdescOptions.map((job) => (
                        <option key={job} value={job}>
                          {job}
                        </option>
                      ))}
                    </select>
                  </label>

                  {/* Ketua Dropdown */}
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700 mb-1.5 block">Ketua</span>
                    <select
                      value={assignment.ketua}
                      onChange={(e) => updateAssignment(assignment.id, "ketua", e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none transition bg-yellow-50 font-medium"
                      required
                    >
                      <option value="">Select Leader</option>
                      {ketuaOptions.map((ketua) => (
                        <option key={ketua} value={ketua}>
                          {ketua}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            ))}
          </div>

          {/* Submit Button */}
          <div className="flex justify-center pt-4">
            <button
              type="submit"
              className="px-8 py-3 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold rounded-lg transition shadow-md hover:shadow-lg text-lg"
            >
              Confirm Assignment
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
