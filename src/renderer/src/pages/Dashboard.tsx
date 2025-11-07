/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState } from "react";

export default function Dashboard() {
  const [rawSchedule, setRawSchedule] = useState<any[]>([]);
  const [scheduleMap, setScheduleMap] = useState<Record<string, any[]>>({});
  const [supervisorMap, setSupervisorMap] = useState<Record<string, string[]>>({});
  const [workers, setWorkers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- FIXED 7-HARI MINGGU INI ---
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
        formatted: d.toISOString().split("T")[0],
        day: d.toLocaleDateString("id-ID", { weekday: "long" }),
        date: d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" }),
      };
    });
  }

  const displayedDates = getCurrentWeekDates();

  // --- JAM 07:00 - 21:00 ---
  const timeSlots = Array.from({ length: 21 - 7 }, (_, i) => {
    const h = i + 7;
    const start = String(h).padStart(2, "0");
    const end = String(h + 1).padStart(2, "0");
    return `${start}:00 - ${end}:00`;
  });
  const TIME_SLOT_HEIGHT = 60;

  const getRoleName = (role: string | number) =>
    role === "1" ? "Supervisor" : role === "2" ? "Karyawan" : role === "3" ? "Admin" : "Unknown";

  // --- FETCH WORKERS ---
  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        if (window.electronAPI?.getWorkers) {
          const data = await window.electronAPI.getWorkers();
          setWorkers(data);
        } else {
          console.warn("⚠️ window.electronAPI.getWorkers tidak tersedia.");
        }
      } catch (err) {
        console.error("Gagal memuat workers:", err);
      }
    };
    fetchWorkers();
  }, []);

  // --- FETCH SCHEDULE ---
  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        if (window.electronAPI?.getSchedule) {
          const data = await window.electronAPI.getSchedule();
          setRawSchedule(data);
        } else {
          console.warn("⚠️ window.electronAPI.getSchedule tidak tersedia.");
        }
      } catch (err) {
        console.error("Gagal memuat jadwal:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSchedule();
  }, []);

  // --- PARSE SCHEDULE ---
  useEffect(() => {
    if (rawSchedule.length === 0) return;

    const grouped: Record<string, any> = {};
    const parseTime = (t: string) => {
      const [h, m] = t.split(/[:.]/);
      return { h: parseInt(h), m: parseInt(m || "0") };
    };

    rawSchedule.forEach((item) => {
      // Handle cases where item.date might be invalid
      if (!item.date) {
        console.warn("Invalid schedule item, missing date:", item);
        return;
      }
      const date = new Date(item.date);
      if (isNaN(date.getTime())) { // Check for invalid date
        console.warn("Invalid date in schedule item:", item);
        return;
      }

      const dateKey = date.toLocaleDateString("sv-SE"); // hasilnya "2025-11-06"
      const key = `${dateKey}_${item.supervisor_name}_${item.start_time}`;

      if (!grouped[key]) {
        grouped[key] = {
          id: key,
          dateKey,
          supervisor_name: item.supervisor_name,
          workers: [],
          start: item.start_time,
          end: item.end_time,
        };
      }
      grouped[key].workers.push({
        worker_name: item.worker_name,
        jobdesc_name: item.jobdesc_name,
      });
    });

    const newSchedule: Record<string, any[]> = {};

    Object.values(grouped).forEach((ev: any) => {
      const s = parseTime(ev.start);
      const e = parseTime(ev.end);
      // Add checks for invalid start/end times
      if (isNaN(s.h) || isNaN(e.h)) {
        console.warn("Invalid start/end time in event:", ev);
        return;
      }

      const startHour = s.h;
      const endHour = e.m > 0 ? e.h : e.h - 1;

      const gridRowStart = startHour - 7 + 1;
      const gridRowSpan = endHour - startHour + 1;

      if (!newSchedule[ev.dateKey]) newSchedule[ev.dateKey] = [];
      newSchedule[ev.dateKey].push({
        ...ev,
        gridRowStart,
        gridRowSpan,
        startHour,
        endHour: endHour + 1,
      });
    });

    // --- Handle Overlaps per Supervisor ---
    for (const dateKey in newSchedule) {
      const events = newSchedule[dateKey];
      const supervisorGroups: Record<string, any[]> = {};

      events.forEach((ev) => {
        if (!supervisorGroups[ev.supervisor_name]) supervisorGroups[ev.supervisor_name] = [];
        supervisorGroups[ev.supervisor_name].push(ev);
      });

      for (const sup in supervisorGroups) {
        const supervEvents = supervisorGroups[sup];
        supervEvents.sort((a, b) => a.startHour - b.startHour);

        const columns: number[] = [];

        supervEvents.forEach((ev) => {
          let assigned = false;
          for (let i = 0; i < columns.length; i++) {
            if (columns[i] <= ev.startHour) {
              ev.subColumn = i;
              columns[i] = ev.endHour;
              assigned = true;
              break;
            }
          }
          if (!assigned) {
            ev.subColumn = columns.length;
            columns.push(ev.endHour);
          }
        });

        supervEvents.forEach((ev) => (ev.totalSubColumns = columns.length));
      }
    }

    setScheduleMap(newSchedule);

    const newSupervisorMap: Record<string, string[]> = {};
    for (const date in newSchedule) {
      newSupervisorMap[date] = [
        ...new Set(newSchedule[date].map((e) => e.supervisor_name)),
      ].sort();
    }
    setSupervisorMap(newSupervisorMap);
  }, [rawSchedule]);

  // --- Hitung lebar per hari berdasarkan jumlah supervisor ---
  const dayWidths = displayedDates.map((d) => {
    const events = scheduleMap[d.formatted] || [];
    const supervisors = supervisorMap[d.formatted] || [];

    const supervisorSubCols: Record<string, number> = {};
    supervisors.forEach((sup) => {
      const supEvents = events.filter((e) => e.supervisor_name === sup);
      supervisorSubCols[sup] =
        supEvents.length > 0
          ? Math.max(...supEvents.map((e) => e.totalSubColumns || 1))
          : 1;
    });

    const totalCols = Object.values(supervisorSubCols).reduce((a, b) => a + b, 0) || 1;
    return `minmax(${totalCols * 150}px, ${totalCols}fr)`;
  });

  // --- UI ---
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-600">
        <div className="animate-pulse text-lg">Memuat data jadwal...</div>
      </div>
    );
  }


  // --- UI ---
  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 font-sans">
      <main className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2 text-gray-900">Dashboard</h2>
            <p className="text-gray-600">
              Weekly schedule overview (Auto: {displayedDates[0]?.date} -{" "}
              {displayedDates[6]?.date})
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* WORKER LIST */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-md overflow-y-auto max-h-[80vh]">
            <h2 className="text-xl font-bold mb-3">Daftar Worker</h2>
            <ul className="space-y-1 text-sm">
              {workers.map((w, i) => (
                <li
                  key={i}
                  className="flex justify-between border p-2 rounded hover:bg-gray-50 transition"
                >
                  <span>{w.name}</span>
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-medium">
                    {getRoleName(w.role_id)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* SCHEDULE GRID */}
          <div className="lg:col-span-3">
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition">
              <div className="overflow-x-auto overflow-y-auto max-h-[80vh]">
                <div
                  className="grid"
                  style={{
                    gridTemplateColumns: `120px ${dayWidths.join(' ')}`,
                    minWidth: "max-content",
                  }}
                >
                  {/* --- HEADER (2 Baris, Sticky) --- */}

                  {/* Baris 1: Jam (Span 2 baris) */}
                  <div
                    className="sticky top-0 left-0 px-6 py-4 text-left text-sm font-semibold text-gray-700 bg-gray-50 border-b border-r border-gray-200 z-30 flex items-center"
                    style={{ gridRow: "span 2 / span 2" }}
                  >
                    Jam
                  </div>

                  {/* Baris 1: Tanggal */}
                  {displayedDates.map((d) => (
                    <div
                      key={d.formatted}
                      className="sticky top-0 px-6 py-4 text-center text-sm font-semibold text-gray-700 bg-gray-100 border-b border-gray-200 z-20"
                    >
                      {d.day}, {d.date}
                    </div>
                  ))}

                  {/* Baris 2: Supervisor (Nested Grid) */}
                  {displayedDates.map((d, dayIndex) => {
                    const events = scheduleMap[d.formatted] || [];
                    const supervisors = supervisorMap[d.formatted] || [];

                    // Hitung subcolumns per supervisor
                    const supervisorSubCols: Record<string, number> = {};
                    supervisors.forEach((sup) => {
                      const supEvents = events.filter(
                        (e) => e.supervisor_name === sup
                      );
                      supervisorSubCols[sup] =
                        supEvents.length > 0
                          ? Math.max(...supEvents.map((e) => e.totalSubColumns || 1))
                          : 1;
                    });

                    const totalSubCols = Object.values(supervisorSubCols).reduce(
                      (a, b) => a + b,
                      0
                    );

                    return (
                      <div
                        key={`${d.formatted}-supervisors`}
                        className="sticky top-[57px] bg-gray-50 border-b border-gray-200 z-20"
                        style={{
                          gridColumnStart: dayIndex + 2,
                          gridRowStart: 2,
                        }}
                      >
                        <div
                          className="grid h-full"
                          style={{
                            gridTemplateColumns: `repeat(${totalSubCols || 1}, minmax(150px, 1fr))`,
                          }}
                        >
                          {supervisors.length > 0 ? (
                            supervisors.map((name, i) => {
                              const cols = supervisorSubCols[name];
                              return (
                                <div
                                  key={name}
                                  className="px-3 py-2 text-xs font-medium text-gray-600 text-center border-r border-gray-200"
                                  style={{
                                    gridColumn: `span ${cols} / span ${cols}`,
                                  }}
                                >
                                  {name}
                                </div>
                              );
                            })
                          ) : (
                            <div className="px-3 py-2 text-xs italic text-gray-400 text-center">
                              -
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* --- BODY GRID --- */}

                  {/* Kolom 1: Sumbu Jam */}
                  <div
                    className="col-start-1 sticky left-0 z-10"
                    style={{
                      display: "grid",
                      gridTemplateRows: `repeat(${timeSlots.length}, ${TIME_SLOT_HEIGHT}px)`,
                      gridRowStart: 3,
                    }}
                  >
                    {timeSlots.map((slot, i) => (
                      <div
                        key={i}
                        className="px-4 py-2 text-sm font-medium text-gray-900 border-r border-b border-gray-100 bg-gray-50 box-border"
                        style={{ height: `${TIME_SLOT_HEIGHT}px` }}
                      >
                        {slot}
                      </div>
                    ))}
                  </div>

                  {/* Kolom 2-dst: Kolom Hari (Tempat Jadwal) */}
                  {displayedDates.map((d, dayIndex) => {
                    const events = scheduleMap[d.formatted] || [];
                    const supervisors = supervisorMap[d.formatted] || [];

                    // Hitung subcolumns per supervisor
                    const supervisorSubCols: Record<string, number> = {};
                    supervisors.forEach((sup) => {
                      const supEvents = events.filter((e) => e.supervisor_name === sup);
                      supervisorSubCols[sup] =
                        supEvents.length > 0
                          ? Math.max(...supEvents.map((e) => e.totalSubColumns || 1))
                          : 1;
                    });

                    const totalSubCols =
                      Object.values(supervisorSubCols).reduce((a, b) => a + b, 0) || 1;

                    return (
                      <div
                        key={d.formatted}
                        className={`relative grid border-l border-gray-300 ${
                          dayIndex % 2 === 0 ? "bg-gray-50" : "bg-white"
                        }`}
                        style={{
                          gridTemplateRows: `repeat(${timeSlots.length}, ${TIME_SLOT_HEIGHT}px)`,
                          gridTemplateColumns: `repeat(${totalSubCols}, minmax(150px, 1fr))`,
                          gridColumnStart: dayIndex + 2,
                          gridRowStart: 3,
                        }}
                      >
                        {/* Latar belakang garis-garis (Grid Cell) */}
                        {Array.from({ length: timeSlots.length * totalSubCols }).map((_, i) => {
                          const row = Math.floor(i / totalSubCols) + 1;
                          const col = (i % totalSubCols) + 1;
                          return (
                            <div
                              key={`cell-${i}`}
                              style={{
                                gridRow: row,
                                gridColumn: col,
                                height: `${TIME_SLOT_HEIGHT}px`,
                              }}
                              className={`border-b border-gray-100 box-border ${
                                col < totalSubCols ? "border-r border-gray-100" : ""
                              }`}
                            />
                          );
                        })}

                        {/* Render Event Jadwal */}
                        {events.map((ev) => {
                          const supIndex = supervisors.indexOf(ev.supervisor_name);
                          if (supIndex === -1) return null;

                          // Hitung offset kolom dari supervisor sebelumnya
                          let colOffset = 0;
                          for (let i = 0; i < supIndex; i++) {
                            colOffset += supervisorSubCols[supervisors[i]];
                          }

                          const colStart = colOffset + ev.subColumn + 1;

                          return (
                            <div
                              key={ev.id}
                              style={{
                                gridRowStart: ev.gridRowStart,
                                gridRowEnd: `span ${ev.gridRowSpan}`,
                                gridColumnStart: colStart,
                                padding: "0.25rem",
                                zIndex: 1,
                              }}
                            >
                              <div className="h-full p-2 border border-blue-200 rounded-lg bg-blue-50 shadow-sm overflow-hidden">
                                <div className="text-blue-700 font-semibold mb-1 text-xs truncate">
                                  {ev.supervisor_name}
                                </div>
                                {ev.workers.map((w: any, j: number) => (
                                  <div
                                    key={j}
                                    className="text-xs text-gray-700 leading-tight truncate"
                                  >
                                    • {w.worker_name} —{" "}
                                    <span className="font-medium">{w.jobdesc_name}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}

                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
