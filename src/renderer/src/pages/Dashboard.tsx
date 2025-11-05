"use client"

import { useEffect, useState } from "react";
import { ChevronRight, Plus} from "lucide-react";

export default function Dashboard() {
  const [schedule, setSchedule] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [scheduleTable, setScheduleTable] = useState<any>({});

  // 🔹 Ambil tanggal minggu ini (Senin–Minggu)
  function getCurrentWeekDates() {
    const today = new Date();
    const currentDay = today.getDay();
    const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return {
        day: d.toLocaleDateString("id-ID", { weekday: "long" }),
        date: d.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
        }),
      };
    });
  }

  // 🔹 Jam dari 07:00–21:00 per 1 jam
  const generateTimeSlots = () => {
    const hours: string[] = [];
    for (let h = 7; h < 21; h++) {
      const start = String(h).padStart(2, "0");
      const end = String(h + 1).padStart(2, "0");
      hours.push(`${start}:00 - ${end}:00`);
    }
    return hours;
  };

  // Konversi data schedule mentah (pakai start_time, end_time, date)
  const parseScheduleData = (schedules: any[]) => {
    const tempTable: Record<string, Record<string, any>> = {};

    schedules.forEach((item) => {
      const dayKey = item.date.split(",")[0].trim(); // contoh: "Selasa"
      const [startHour] = item.start_time.split(".");
      const [endHour] = item.end_time.split(".");
      const timeKey = `${startHour.padStart(2, "0")}:00 - ${endHour.padStart(2, "0")}:00`;

      const supervisor = item.supervisor_name;

      if (!tempTable[dayKey]) tempTable[dayKey] = {};
      if (!tempTable[dayKey][timeKey]) tempTable[dayKey][timeKey] = {};

      if (!tempTable[dayKey][timeKey][supervisor]) {
        tempTable[dayKey][timeKey][supervisor] = {
          supervisor_name: supervisor,
          workers: [],
        };
      }

      tempTable[dayKey][timeKey][supervisor].workers.push({
        worker_name: item.worker_name,
        jobdesc_name: item.jobdesc_name,
      });
    });

    const finalTable: Record<string, Record<string, any[]>> = {};
    for (const day in tempTable) {
      finalTable[day] = {};
      for (const time in tempTable[day]) {
        finalTable[day][time] = Object.values(tempTable[day][time]);
      }
    }

    return finalTable;
  };

  const weekDates = getCurrentWeekDates();
  const timeSlots = generateTimeSlots();

  useEffect(() => {
    window.electronAPI
      .getSchedule()
      .then((data) => {
        console.log("📦 schedule data:", data);
        setSchedule(data);
      })
      .catch((err) => console.error("Error fetching schedule:", err))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (schedule.length > 0) {
      const parsed = parseScheduleData(schedule);
      console.log("🧩 Parsed Table:", parsed);
      setScheduleTable(parsed);
    }
  }, [schedule]);

  const getScheduleCell = (day: string, timeSlot: string) => {
    const dayData = scheduleTable[day];
    if (!dayData) return [];
    return dayData[timeSlot] || [];
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* 🔹 Main Content */}
      <main className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2 text-gray-900">Weekly Schedule</h2>
            <p className="text-gray-600">
              View and manage worker schedules from Google Sheets
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E63946] hover:bg-[#d62828] transition text-white font-semibold">
            <Plus size={18} />
            Assign Worker
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition border-l-4 border-l-[#0066FF]">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Jam
                  </th>
                  {weekDates.map((w) => (
                    <th key={w.day} className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      {w.day}, {w.date}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      Loading schedule...
                    </td>
                  </tr>
                ) : (
                  timeSlots.map((slot, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-blue-50 transition">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 border-r border-gray-200 bg-gray-50">
                        {slot}
                      </td>
                      {weekDates.map((w, dIndex) => {
                        const cellData = getScheduleCell(w.day, slot);
                        if (cellData.length === 0)
                          return (
                            <td key={dIndex} className="px-4 py-3 text-sm text-gray-400 text-center">
                              -
                            </td>
                          );

                        return (
                          <td
                            key={dIndex}
                            className="px-4 py-3 text-sm text-gray-700 text-center align-top border-r border-gray-100"
                          >
                            {cellData.map((group, idx) => (
                              <div
                                key={idx}
                                className="mb-2 rounded-lg bg-blue-100 border border-blue-300 p-2 text-left"
                              >
                                <div className="font-semibold text-blue-800 mb-1">
                                  {group.supervisor_name}
                                </div>
                                {group.workers.map((w: any, i: number) => (
                                  <div key={i} className="text-xs text-gray-700">
                                    {w.jobdesc_name}: {w.worker_name}
                                  </div>
                                ))}
                              </div>
                            ))}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {schedule.length} schedules
            </p>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E63946] hover:bg-[#d62828] transition text-white text-sm font-medium">
              See More <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
