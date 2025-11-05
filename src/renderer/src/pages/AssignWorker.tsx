"use client"

import { useEffect, useState } from "react"
import { Plus, X } from "lucide-react"

interface Worker {
  id: string;
  name: string;
}

interface Jobdesc {
  id: string;
  name: string;
}

interface Supervisor {
  id: string;
  name: string;
}

interface WorkerAssignment {
  id: string
  workerId: string
  workerName: string
  jobdescId: string
  jobdescName: string
  supervisorId: string
  supervisorName: string
}

export default function AssignWorker() {
  const [workers, setWorkers] = useState<Worker[]>([])
  const [jobdescOptions, setJobdescOptions] = useState<Jobdesc[]>([])
  const [supervisorOptions, setSupervisorOptions] = useState<Supervisor[]>([])

  const [date, setDate] = useState("")
  const [location, setLocation] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")

  const [assignments, setAssignments] = useState<WorkerAssignment[]>([
    { id: "1", workerId: "", workerName: "", jobdescId: "", jobdescName: "", supervisorId: "", supervisorName: "" }
  ])

  // Modal states
  const [showJobdescModal, setShowJobdescModal] = useState(false)
  const [showSupervisorModal, setShowSupervisorModal] = useState(false)
  const [newJobdesc, setNewJobdesc] = useState("")
  const [newSupervisor, setNewSupervisor] = useState("")

  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load data on mount
  useEffect(() => {
    loadWorkers();
    loadJobdesc();
    loadSupervisors();
  }, [])

  const loadWorkers = async () => {
    if (window.electronAPI?.getWorkersId) {
      try {
        const data = await window.electronAPI.getWorkersId()
        setWorkers(data)
      } catch (error) {
        console.error("Failed to load workers:", error)
      }
    }
  }

  const loadJobdesc = async () => {
    if (window.electronAPI?.getJobdesc) {
      try {
        const data = await window.electronAPI.getJobdesc()
        setJobdescOptions(data)
      } catch (error) {
        console.error("Failed to load jobdesc:", error)
        setJobdescOptions([
          { id: "1", name: "Sound System" },
          { id: "2", name: "Lighting" }
        ])
      }
    }
  }

  const loadSupervisors = async () => {
    if (window.electronAPI?.getKetua) {
      try {
        const data = await window.electronAPI.getKetua()
        setSupervisorOptions(data)
      } catch (error) {
        console.error("Failed to load supervisors:", error)
        setSupervisorOptions([
          { id: "1", name: "Ahmad" },
          { id: "2", name: "Budi" }
        ])
      }
    }
  }

  const addAssignment = () => {
    setAssignments([
      ...assignments,
      {
        id: Date.now().toString(),
        workerId: "",
        workerName: "",
        jobdescId: "",
        jobdescName: "",
        supervisorId: "",
        supervisorName: ""
      }
    ])
  }

  const removeAssignment = (id: string) => {
    if (assignments.length > 1) {
      setAssignments(assignments.filter((a) => a.id !== id))
    }
  }

  const updateAssignment = (id: string, field: string, value: string) => {
    setAssignments(assignments.map((a) => {
      if (a.id !== id) return a;

      const updated = { ...a };

      // Update worker
      if (field === "worker") {
        const worker = workers.find(w => w.id === value);
        if (worker) {
          updated.workerId = worker.id;
          updated.workerName = worker.name;
        }
      }

      // Update jobdesc
      if (field === "jobdesc") {
        const jobdesc = jobdescOptions.find(j => j.id === value);
        if (jobdesc) {
          updated.jobdescId = jobdesc.id;
          updated.jobdescName = jobdesc.name;
        }
      }

      // Update supervisor
      if (field === "supervisor") {
        const supervisor = supervisorOptions.find(s => s.id === value);
        if (supervisor) {
          updated.supervisorId = supervisor.id;
          updated.supervisorName = supervisor.name;
        }
      }

      return updated;
    }))
  }

  const handleAddJobdesc = async () => {
    if (!newJobdesc.trim()) {
      alert("Please enter a job description name");
      return;
    }

    // Check if already exists
    if (jobdescOptions.some(j => j.name.toLowerCase() === newJobdesc.trim().toLowerCase())) {
      alert("This job description already exists");
      return;
    }

    try {
      if (window.electronAPI?.addJobdesc) {
        const result = await window.electronAPI.addJobdesc(newJobdesc.trim());

        if (result.ok && result.id && result.name) {
          // Add to local state
          setJobdescOptions([...jobdescOptions, { id: result.id.toString(), name: result.name }]);
          setNewJobdesc("");
          setShowJobdescModal(false);
          alert("Job description added successfully!");
        } else {
          alert("Failed to add job description");
        }
      }
    } catch (error) {
      console.error("Error adding jobdesc:", error);
      alert("Error adding job description");
    }
  }

  const handleAddSupervisor = async () => {
    if (!newSupervisor.trim()) {
      alert("Please enter a supervisor name");
      return;
    }

    // Check if already exists
    if (supervisorOptions.some(s => s.name.toLowerCase() === newSupervisor.trim().toLowerCase())) {
      alert("This supervisor already exists");
      return;
    }

    try {
      if (window.electronAPI?.addSupervisor) {
        const result = await window.electronAPI.addSupervisor(newSupervisor.trim());

        if (result.ok && result.id && result.name) {
          // Add to local state
          setSupervisorOptions([...supervisorOptions, { id: result.id.toString(), name: result.name }]);
          setNewSupervisor("");
          setShowSupervisorModal(false);
          alert("Supervisor added successfully!");
        } else {
          alert("Failed to add supervisor");
        }
      }
    } catch (error) {
      console.error("Error adding supervisor:", error);
      alert("Error adding supervisor");
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!date || !location || !startTime || !endTime) {
      alert("Please fill in all event details");
      return;
    }

    const invalidAssignments = assignments.filter(a =>
      !a.workerId || !a.jobdescId || !a.supervisorId
    )

    if (invalidAssignments.length > 0) {
      alert("Please fill in all worker assignments (Worker, Jobdesc, and Supervisor)")
      return
    }

    // Check for duplicate workers
    const workerIds = assignments.map(a => a.workerId)
    const duplicates = workerIds.filter((id, index) => workerIds.indexOf(id) !== index)

    if (duplicates.length > 0) {
      const duplicateNames = assignments
        .filter(a => duplicates.includes(a.workerId))
        .map(a => a.workerName)
      alert(`Duplicate workers found: ${[...new Set(duplicateNames)].join(", ")}. Each worker can only be assigned once per event.`)
      return
    }

    // Time validation
    if (startTime >= endTime) {
      alert("End time must be after start time");
      return;
    }

    setIsSubmitting(true);

    try {
      // Submit all assignments
      const results = await Promise.all(
        assignments.map(async (assignment) => {
          const payload = {
            workerId: assignment.workerId,
            jobdescId: assignment.jobdescId,
            supervisorId: assignment.supervisorId,
            date: date,
            startTime: startTime,
            endTime: endTime,
            location: location,
          };

          if (window.electronAPI?.addSchedule) {
            const result = await window.electronAPI.addSchedule(payload);
            return {
              ...result,
              workerName: assignment.workerName
            };
          }
          return { ok: false, workerName: assignment.workerName };
        })
      );

      const successCount = results.filter(r => r.ok).length;
      const failedResults = results.filter(r => !r.ok);

      if (successCount === assignments.length) {
        alert(`Successfully assigned ${assignments.length} worker(s)!`);

        // Reset form
        setDate("");
        setLocation("");
        setStartTime("");
        setEndTime("");
        setAssignments([{
          id: "1",
          workerId: "",
          workerName: "",
          jobdescId: "",
          jobdescName: "",
          supervisorId: "",
          supervisorName: ""
        }]);
      } else if (successCount > 0) {
        // Show which workers had conflicts
        const errorMessages = failedResults
          .map(r => `${r.workerName}: ${r.error || 'Unknown error'}`)
          .join('\n\n');
        alert(`Partially successful: ${successCount} out of ${assignments.length} workers assigned.\n\nErrors:\n${errorMessages}`);
      } else {
        // All failed
        const errorMessages = failedResults
          .map(r => `${r.workerName}: ${r.error || 'Unknown error'}`)
          .join('\n\n');
        alert(`Failed to assign workers:\n\n${errorMessages}`);
      }
    } catch (error) {
      console.error("Error assigning workers:", error);
      alert("Failed to assign workers. Please try again.");
    } finally {
      setIsSubmitting(false);
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
          {/* Event Details */}
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
                      value={assignment.workerId}
                      onChange={(e) => updateAssignment(assignment.id, "worker", e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none transition bg-yellow-50 font-medium"
                      required
                    >
                      <option value="">Select Worker</option>
                      {workers.map((worker) => (
                        <option key={worker.id} value={worker.id}>
                          {worker.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  {/* Jobdesc Dropdown with + button */}
                  <label className="block">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-gray-700">Jobdesc</span>
                      <button
                        type="button"
                        onClick={() => setShowJobdescModal(true)}
                        className="flex items-center gap-1 px-2 py-1 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-md transition text-xs font-medium"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <select
                      value={assignment.jobdescId}
                      onChange={(e) => updateAssignment(assignment.id, "jobdesc", e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none transition bg-yellow-50 font-medium"
                      required
                    >
                      <option value="">Select Job Description</option>
                      {jobdescOptions.map((job) => (
                        <option key={job.id} value={job.id}>
                          {job.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  {/* Supervisor Dropdown with + button */}
                  <label className="block">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-gray-700">Supervisor</span>
                      <button
                        type="button"
                        onClick={() => setShowSupervisorModal(true)}
                        className="flex items-center gap-1 px-2 py-1 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-md transition text-xs font-medium"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <select
                      value={assignment.supervisorId}
                      onChange={(e) => updateAssignment(assignment.id, "supervisor", e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none transition bg-yellow-50 font-medium"
                      required
                    >
                      <option value="">Select Supervisor</option>
                      {supervisorOptions.map((supervisor) => (
                        <option key={supervisor.id} value={supervisor.id}>
                          {supervisor.name}
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
              disabled={isSubmitting}
              className={`px-8 py-3 font-bold rounded-lg transition shadow-md hover:shadow-lg text-lg ${
                isSubmitting
                  ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                  : "bg-yellow-400 hover:bg-yellow-500 text-gray-900"
              }`}
            >
              {isSubmitting ? "Submitting..." : "Confirm Assignment"}
            </button>
          </div>
        </form>
      </div>

      {/* Add Jobdesc Modal */}
      {showJobdescModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Add New Job Description</h3>
            <input
              type="text"
              value={newJobdesc}
              onChange={(e) => setNewJobdesc(e.target.value)}
              placeholder="Enter job description"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none mb-4"
              onKeyPress={(e) => e.key === 'Enter' && handleAddJobdesc()}
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowJobdescModal(false)
                  setNewJobdesc("")
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddJobdesc}
                className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium rounded-lg transition"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Supervisor Modal */}
      {showSupervisorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Add New Supervisor</h3>
            <input
              type="text"
              value={newSupervisor}
              onChange={(e) => setNewSupervisor(e.target.value)}
              placeholder="Enter supervisor name"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none mb-4"
              onKeyPress={(e) => e.key === 'Enter' && handleAddSupervisor()}
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowSupervisorModal(false)
                  setNewSupervisor("")
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddSupervisor}
                className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium rounded-lg transition"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
