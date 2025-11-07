"use client"

import { useEffect, useState } from "react"
import { Plus, X, CheckCircle, XCircle, ArrowLeft } from "lucide-react"

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
  scheduleId?: string // Add this to track which schedule row this came from
}

interface EditScheduleProps {
  scheduleData: {
    dateKey: string;
    supervisor_name: string;
    start: string;
    end: string;
    workers: Array<{
      worker_name: string;
      jobdesc_name: string;
      tempat?: string;
      schedule_id?: string; // ID of the schedule entry
    }>;
    location?: string;
  };
  onBack: () => void;
  onSaveSuccess: () => void;
}

export default function EditSchedule({ scheduleData, onBack, onSaveSuccess }: EditScheduleProps) {
  const [workers, setWorkers] = useState<Worker[]>([])
  const [jobdescOptions, setJobdescOptions] = useState<Jobdesc[]>([])
  const [supervisorOptions, setSupervisorOptions] = useState<Supervisor[]>([])

  const [date, setDate] = useState("")
  const [location, setLocation] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")

  const [assignments, setAssignments] = useState<WorkerAssignment[]>([])
  const [scheduleIdsToDelete, setScheduleIdsToDelete] = useState<string[]>([])

  const [showJobdescModal, setShowJobdescModal] = useState(false)
  const [newJobdesc, setNewJobdesc] = useState("")

  const [isSubmitting, setIsSubmitting] = useState(false)

  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success'
  })

  useEffect(() => {
    loadWorkers();
    loadJobdesc();
    loadSupervisors();
    loadScheduleData();
  }, [])

  const loadScheduleData = async () => {
    if (!window.electronAPI?.getSchedule) return;

    try {
      const allSchedules = await window.electronAPI.getSchedule();
      console.log("All schedules:", allSchedules);

      // Find all schedule IDs that match this event (same date, supervisor, and time)
      const matchingSchedules = allSchedules.filter((s: any) => {
        const scheduleDate = new Date(s.date);
        const scheduleDateStr = scheduleDate.toISOString().split('T')[0];

        return scheduleDateStr === scheduleData.dateKey &&
               s.supervisor_name === scheduleData.supervisor_name &&
               s.start_time === scheduleData.start;
      });

      const idsToDelete = matchingSchedules.map((s: any) => s.id);
      console.log("Schedule IDs to delete:", idsToDelete);
      setScheduleIdsToDelete(idsToDelete);

    } catch (error) {
      console.error("Error loading schedule data:", error);
    }
  };

  useEffect(() => {
    if (scheduleData && workers.length > 0 && jobdescOptions.length > 0 && supervisorOptions.length > 0) {
      console.log("Populating form with:", scheduleData);

      setDate(scheduleData.dateKey);
      setStartTime(scheduleData.start);
      setEndTime(scheduleData.end);
      setLocation(scheduleData.location || scheduleData.workers[0]?.tempat || "");

      const supervisor = supervisorOptions.find(s => s.name === scheduleData.supervisor_name);

      const mappedAssignments: WorkerAssignment[] = scheduleData.workers.map((w, index) => {
        const worker = workers.find(wk => wk.name === w.worker_name);
        const jobdesc = jobdescOptions.find(j => j.name === w.jobdesc_name);

        return {
          id: `assignment-${index}`,
          workerId: worker?.id || "",
          workerName: worker?.name || w.worker_name,
          jobdescId: jobdesc?.id || "",
          jobdescName: jobdesc?.name || w.jobdesc_name,
          supervisorId: supervisor?.id || "",
          supervisorName: supervisor?.name || scheduleData.supervisor_name,
          scheduleId: w.schedule_id
        };
      });

      setAssignments(mappedAssignments.length > 0 ? mappedAssignments : [{
        id: "1",
        workerId: "",
        workerName: "",
        jobdescId: "",
        jobdescName: "",
        supervisorId: supervisor?.id || "",
        supervisorName: supervisor?.name || ""
      }]);
    }
  }, [scheduleData, workers, jobdescOptions, supervisorOptions])

  useEffect(() => {
    if (!showJobdescModal) {
      setNewJobdesc("");
    }
  }, [showJobdescModal])

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast({ ...toast, show: false })
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [toast.show])

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type })
  }

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
        supervisorId: assignments[0]?.supervisorId || "",
        supervisorName: assignments[0]?.supervisorName || ""
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

      if (field === "worker") {
        const worker = workers.find(w => w.id === value);
        if (worker) {
          updated.workerId = worker.id;
          updated.workerName = worker.name;
        }
      }

      if (field === "jobdesc") {
        const jobdesc = jobdescOptions.find(j => j.id === value);
        if (jobdesc) {
          updated.jobdescId = jobdesc.id;
          updated.jobdescName = jobdesc.name;
        }
      }

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

  const updateAllSupervisors = (value: string) => {
    const supervisor = supervisorOptions.find(s => s.id === value);
    if (supervisor) {
      setAssignments(assignments.map(a => ({
        ...a,
        supervisorId: supervisor.id,
        supervisorName: supervisor.name
      })));
    }
  }

  const handleAddJobdesc = async () => {
    if (!newJobdesc.trim()) {
      showToast("Please enter a job description name", "error");
      return;
    }

    if (jobdescOptions.some(j => j.name.toLowerCase() === newJobdesc.trim().toLowerCase())) {
      showToast("This job description already exists", "error");
      return;
    }

    try {
      if (window.electronAPI?.addJobdesc) {
        const result = await window.electronAPI.addJobdesc(newJobdesc.trim());

        if (result.ok && result.id && result.name) {
          setJobdescOptions([...jobdescOptions, { id: result.id.toString(), name: result.name }]);
          setNewJobdesc("");
          setShowJobdescModal(false);
          showToast("Job description added successfully!", "success");
        } else {
          showToast("Failed to add job description", "error");
        }
      }
    } catch (error) {
      console.error("Error adding jobdesc:", error);
      showToast("Error adding job description", "error");
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!date || !location || !startTime || !endTime) {
      showToast("Please fill in all event details", "error");
      return;
    }

    if (scheduleIdsToDelete.length === 0) {
      showToast("Error: Cannot identify schedules to update", "error");
      return;
    }

    const invalidAssignments = assignments.filter(a =>
      !a.workerId || !a.jobdescId || !a.supervisorId
    )

    if (invalidAssignments.length > 0) {
      showToast("Please fill in all worker assignments", "error");
      return
    }

    const workerIds = assignments.map(a => a.workerId)
    const duplicates = workerIds.filter((id, index) => workerIds.indexOf(id) !== index)

    if (duplicates.length > 0) {
      const duplicateNames = assignments
        .filter(a => duplicates.includes(a.workerId))
        .map(a => a.workerName)
      showToast(`Duplicate workers: ${[...new Set(duplicateNames)].join(", ")}`, "error");
      return
    }

    // --- START: Time Range Enforcement (The solution for 07:00 to 21:00) ---
    const MIN_TIME = "07:00";
    const MAX_TIME = "21:00";

    if (startTime < MIN_TIME || startTime > MAX_TIME || endTime < MIN_TIME || endTime > MAX_TIME) {
        showToast(`The event time must be between ${MIN_TIME} and ${MAX_TIME}.`, "error");
        return;
    }
    // --- END: Time Range Enforcement ---

    if (startTime >= endTime) {
      showToast("End time must be after start time", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      console.log("Submitting updates...");
      console.log("IDs to delete:", scheduleIdsToDelete);

      // Update each worker assignment
      const results = await Promise.all(
        assignments.map(async (assignment) => {
          const payload = {
            scheduleIdsToDelete: scheduleIdsToDelete,
            workerId: assignment.workerId,
            jobdescId: assignment.jobdescId,
            supervisorId: assignment.supervisorId,
            date: date,
            startTime: startTime,
            endTime: endTime,
            location: location,
          };

          if ((window as any).electronAPI?.updateSchedule) {
            const result = await (window as any).electronAPI.updateSchedule(payload);
            return {
              ...result,
              workerName: assignment.workerName
            };
          }
          return { ok: false, workerName: assignment.workerName, error: 'Update API not available' };
        })
      );

      const successCount = results.filter(r => r.ok).length;
      const failedResults = results.filter(r => !r.ok);

      if (successCount === assignments.length) {
        showToast(`Successfully updated ${assignments.length} worker(s)!`, "success");
        setTimeout(() => {
          onSaveSuccess();
        }, 1500);
      } else if (successCount > 0) {
        const errorMessages = failedResults
          .map(r => `${r.workerName}: ${r.error || 'Unknown error'}`)
          .join(', ');
        showToast(`Partial success: ${successCount}/${assignments.length}. Errors: ${errorMessages}`, "error");
      } else {
        const errorMessages = failedResults
          .map(r => r.error || 'Unknown error')
          .join(', ');
        showToast(`Failed to update: ${errorMessages}`, "error");
      }
    } catch (error) {
      console.error("Error updating schedule:", error);
      showToast("Failed to update schedule", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {toast.show && (
        <div className="fixed top-4 right-4 z-50 animate-slideIn">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-lg shadow-lg ${
            toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white`}>
            {toast.type === 'success' ? <CheckCircle size={24} /> : <XCircle size={24} />}
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto p-8">
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 font-medium"
          >
            <ArrowLeft size={20} />
            Back to Schedule
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Schedule</h1>
          <p className="text-gray-600">Modify the event details and worker assignments</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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

          <div className="bg-white border-2 border-gray-200 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Event Time</h3>
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm font-semibold text-gray-700 mb-2 block">Waktu Mulai</span>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  min="07:00"
                  max="21:00"
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
                  min="07:00"
                  max="21:00"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none transition bg-blue-50"
                  required
                />
              </label>
            </div>
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Event Supervisor</h3>
            <label className="block">
              <span className="text-sm font-medium text-gray-700 mb-1.5 block">Supervisor (applies to all workers)</span>
              <select
                value={assignments[0]?.supervisorId || ""}
                onChange={(e) => updateAllSupervisors(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none transition bg-white font-medium"
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
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700 mb-1.5 block">Worker</span>
                    <select
                      value={assignment.workerId}
                      onChange={(e) => updateAssignment(assignment.id, "worker", e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none transition bg-blue-50 font-medium"
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

                  <label className="block">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-gray-700">Jobdesc</span>
                      <button
                        type="button"
                        onClick={() => setShowJobdescModal(true)}
                        className="flex items-center gap-1 px-2 py-1 bg-blue-400 hover:bg-blue-500 text-white rounded-md transition text-xs font-medium"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <select
                      value={assignment.jobdescId}
                      onChange={(e) => updateAssignment(assignment.id, "jobdesc", e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none transition bg-blue-50 font-medium"
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
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-4 pt-4">
            <button
              type="button"
              onClick={onBack}
              className="px-8 py-3 font-bold rounded-lg transition shadow-md hover:shadow-lg text-lg bg-gray-300 hover:bg-gray-400 text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-8 py-3 font-bold rounded-lg transition shadow-md hover:shadow-lg text-lg ${
                isSubmitting
                  ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>

      {showJobdescModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowJobdescModal(false);
              setNewJobdesc("");
            }
          }}
        >
          <div className="bg-white rounded-xl p-6 w-96 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Add New Job Description</h3>
            <input
              type="text"
              value={newJobdesc}
              onChange={(e) => setNewJobdesc(e.target.value)}
              placeholder="Enter job description"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none mb-4"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddJobdesc();
                }
                if (e.key === 'Escape') {
                  setShowJobdescModal(false);
                  setNewJobdesc("");
                }
              }}
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
                className="px-4 py-2 bg-blue-400 hover:bg-blue-500 text-white font-medium rounded-lg transition"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
