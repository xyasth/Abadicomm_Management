import { useEffect, useState } from "react";
import { ChevronRight, Plus } from "lucide-react";

export default function Dashboard() {
  const [rawSchedule, setRawSchedule] = useState<any[]>([]);
  const [scheduleTable, setScheduleTable] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

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

  const generateTimeSlots = () => {
    const hours: string[] = [];
    for (let h = 7; h < 21; h++) {
      const start = String(h).padStart(2, "0");
      const end = String(h + 1).padStart(2, "0");
      hours.push(`${start}:00 - ${end}:00`);
    }
    return hours;
  };

  const parseScheduleData = (schedules: any[]) => {
    const table: Record<string, Record<string, Array<any>>> = {};

    const parseHourMin = (timeStr: string) => {
      const sep = timeStr.includes(":") ? ":" : timeStr.includes(".") ? "." : null;
      if (!sep) return { hour: parseInt(timeStr, 10), min: 0 };
      const [h, m] = timeStr.split(sep);
      return { hour: parseInt(h || "0", 10), min: parseInt(m || "0", 10) };
    };

    const pad = (n: number) => String(n).padStart(2, "0");

    schedules.forEach((item) => {
      const dayKey = item.date.split(",")[0].trim();
      const { hour: sH, min: sM } = parseHourMin(item.start_time);
      const { hour: eH, min: eM } = parseHourMin(item.end_time);

      const startSlot = sH;
      const endSlot = eM > 0 ? eH : eH - 1;

      if (!table[dayKey]) table[dayKey] = {};

      for (let h = startSlot; h <= endSlot; h++) {
        const timeKey = `${pad(h)}:00 - ${pad(h + 1)}:00`;

        if (!table[dayKey][timeKey]) table[dayKey][timeKey] = [];

        const existingGroup = table[dayKey][timeKey].find(
          (g: any) => g.supervisor_name === item.supervisor_name
        );

        const workerObj = {
          jobdesc_name: item.jobdesc_name,
          worker_name: item.worker_name,
          tempat: item.tempat,
        };

        if (existingGroup) {
          existingGroup.workers.push(workerObj);
        } else {
          table[dayKey][timeKey].push({
            supervisor_name: item.supervisor_name,
            workers: [workerObj],
          });
        }
      }
    });

    return table;
  };

  const weekDates = getCurrentWeekDates();
  const timeSlots = generateTimeSlots();

  useEffect(() => {
    window.electronAPI
      .getSchedule()
      .then((data) => {
        setRawSchedule(data);
      })
      .catch((err) => console.error("Error fetching schedule:", err))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (rawSchedule.length > 0) {
      const parsed = parseScheduleData(rawSchedule);
      setScheduleTable(parsed);
    }
  }, [rawSchedule]);

  const getScheduleCell = (day: string, timeSlot: string) => {
    const dayData = scheduleTable[day];
    if (!dayData) return [];
    return dayData[timeSlot] || [];
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
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
          <div className="overflow-x-scroll max-h-[600px] overflow-y-auto">
            <table className="border-collapse" style={{ minWidth: '1200px' }}>
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 min-w-[120px]">
                    Jam
                  </th>
                  {weekDates.map((w) => (
                    <th key={w.day} className="px-6 py-4 text-left text-sm font-semibold text-gray-700 min-w-[180px]">
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
                    <tr key={i} className="border-b border-gray-100 hover:bg-blue-50 transition" style={{ height: '50px' }}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 border-r border-gray-200 bg-gray-50 min-w-[120px]">
                        {slot}
                      </td>

                      {weekDates.map((w, dIndex) => {
                        const cellData = getScheduleCell(w.day, slot);

                        if (cellData.length === 0) {
                          return (
                            <td key={dIndex} className="px-4 py-3 text-sm text-gray-400 text-center min-w-[180px]">
                              -
                            </td>
                          );
                        }

                        return (
                          <td
                            key={dIndex}
                            className="p-2 text-xs text-gray-700 min-w-[180px] align-top"
                          >
                            <div className="flex flex-row gap-2 h-full">
                              {cellData.map((group: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="flex-1 min-w-[140px] p-2 border border-blue-200 rounded bg-blue-100 shadow-sm"
                                >
                                  <div className="text-blue-700 font-semibold mb-1 text-xs">
                                    {group.supervisor_name}
                                  </div>

                                  {group.workers.map((w: any, j: number) => (
                                    <div key={j} className="text-xs text-gray-700 leading-tight">
                                      • {w.worker_name} — <span className="font-medium">{w.jobdesc_name}</span>
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </div>
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
              Showing {rawSchedule.length} schedules
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
