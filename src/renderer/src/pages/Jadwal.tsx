/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState } from "react";
import { Edit } from "lucide-react";
// Tipe data untuk tabel jadwal baru (Dikelompokkan per hari)
// Diubah menjadi 'any[]' untuk mengakomodasi properti subColumn/totalSubColumns
type ScheduleMap = Record<string, any[]>;

// Tipe data untuk map supervisor per hari
// Kuncinya adalah string tanggal "YYYY-MM-DD", nilainya array nama supervisor
type SupervisorMap = Record<string, string[]>;

/**
 * Komponen Modal Alert Kustom
 */
function CustomAlertModal({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  if (!message) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300">
      <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full m-4 transform transition-all duration-300 scale-100 opacity-100">
        <h3 className="text-xl font-bold mb-4 text-gray-800">Pemberitahuan</h3>
        <p className="text-gray-700 mb-6 text-base">{message}</p>
        <button
          onClick={onClose}
          className="w-full px-4 py-2.5 bg-[#0066FF] text-white rounded-lg font-semibold hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          Tutup
        </button>
      </div>
    </div>
  );
}

/**
 * 🔹 Komponen Loading Spinner (dari file 3) 🔹
 */
function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-gray-600">
      <svg
        className="animate-spin -ml-1 mr-3 h-10 w-10 text-blue-600"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      <p className="mt-4 text-lg font-medium">Memuat data jadwal...</p>
    </div>
  );
}

interface JadwalProps {
  onEditSchedule: (scheduleData: any) => void;
}
export default function Jadwal({ onEditSchedule }: JadwalProps) {
  const [rawSchedule, setRawSchedule] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [scheduleMap, setScheduleMap] = useState<ScheduleMap>({});
  const [supervisorMap, setSupervisorMap] = useState<SupervisorMap>({});
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [alertMessage, setAlertMessage] = useState<string>("");
  // 🔹 State 'workers' dihapus

  // --- 🔹 PENGATURAN WAKTU (dari file 3) 🔹 ---
  // Jam mulai (misal: 7 berarti 07:00)
  const TIME_SLOT_BASE_HOUR = 7;
  // Jam selesai (misal: 20 berarti slot terakhir 20:00 - 21:00)
  const TIME_SLOT_END_HOUR = 20;
  const TIME_SLOT_HEIGHT = 60; // Tinggi per jam dalam px

  // --- FUNGSI HELPER ---

  // 🔹 Helper `getRoleName` dihapus

  // --- Fungsi Tanggal (dari file 3) ---
  function getCurrentWeekDates() {
    const today = new Date();
    const currentDay = today.getDay();
    // 0 (Minggu) -> -6, 1 (Senin) -> 0, 2 (Selasa) -> -1
    const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6); // 6 hari setelah senin

    return {
      start: monday.toISOString().split("T")[0],
      end: sunday.toISOString().split("T")[0],
    };
  }

  // 🔹 generateDateRange (dari file 3)
  const generateDateRange = (start: string, end: string) => {
    if (!start || !end) return [];
    // Parse tanggal sebagai UTC untuk menghindari masalah timezone
    const startD = new Date(start + "T00:00:00");
    const endD = new Date(end + "T00:00:00");
    const range: any[] = [];

    // Loop dari startD sampai endD (inklusif)
    for (
      let d = new Date(startD);
      d <= endD;
      d.setDate(d.getDate() + 1)
    ) {
      range.push({
        day: d.toLocaleDateString("id-ID", { weekday: "long" }),
        date: new Date(d),
        formatted: d.toISOString().split("T")[0],
      });
    }
    return range;
  };

  // --- 🔹 Fungsi Jam (dari file 3) ---
  const generateTimeSlots = () => {
    const hours: string[] = [];
    // Loop dari jam 7 (07:00) sampai 20 (20:00)
    for (let h = TIME_SLOT_BASE_HOUR; h <= TIME_SLOT_END_HOUR; h++) {
      const start = String(h).padStart(2, "0");
      const end = String(h + 1).padStart(2, "0");
      hours.push(`${start}:00 - ${end}:00`);
    }
    return hours;
  };

  const timeSlots = generateTimeSlots(); // [ "07:00 - 08:00", ... "20:00 - 21:00" ]
  const displayedDates = generateDateRange(startDate, endDate);

  // --- Inisialisasi Tanggal (dari file 3) ---
  useEffect(() => {
    const weekDates = getCurrentWeekDates();
    setStartDate(weekDates.start);
    setEndDate(weekDates.end);
  }, []);

  // --- 🔹 FETCH WORKERS dihapus ---

  // --- 🔹 Pengambilan Data (Fetch Schedule - dari file 3) 🔹 ---
  // (Tanpa Mock Data)
  useEffect(() => {
    setIsLoading(true); // Mulai loading
    if (window.electronAPI) {
      window.electronAPI
        .getSchedule()
        .then((data) => {
          console.log("📦 schedule data:", data);
          setRawSchedule(data);
        })
        .catch((err) => {
          console.error("Error fetching schedule:", err);
          setAlertMessage("Gagal mengambil data jadwal: " + err.message);
        })
        .finally(() => setIsLoading(false)); // Selesai loading
    } else {
      console.warn("electronAPI not found. No data will be loaded.");
      setIsLoading(false); // Selesai loading
      setAlertMessage(
        "Mode pengembangan: electronAPI tidak ditemukan. Tidak ada data dimuat.",
      );
    }
  }, []);

  // --- 🔹 LOGIKA PARSING BARU (Gabungan overlap & filter waktu) 🔹 ---
  useEffect(() => {
    if (isLoading || rawSchedule.length === 0) {
      // Jika data mentah kosong (setelah loading selesai), reset map
      if (!isLoading) {
        setScheduleMap({});
        setSupervisorMap({});
      }
      return;
    }

    const grouped: Record<string, any> = {};
    const parseTime = (timeStr: string) => {
      const sep = timeStr.includes(":") ? ":" : timeStr.includes(".") ? "." : null;
      if (!sep) return { h: parseInt(timeStr, 10), m: 0 };
      const [h, m] = timeStr.split(sep);
      return { h: parseInt(h || "0", 10), m: parseInt(m || "0", 10) };
    };

    rawSchedule.forEach((item) => {
      if (!item.date || !item.supervisor_name || !item.start_time) {
        console.warn("Skipping incomplete schedule item:", item);
        return;
      }
      const dateKey = new Date(item.date).toISOString().split("T")[0];
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
        tempat: item.tempat,
      });
    });

    const newSchedule: ScheduleMap = {};

    Object.values(grouped).forEach((ev: any) => {
      const s = parseTime(ev.start);
      const e = parseTime(ev.end);
      const startHour = s.h;
      // Jika endTime "08:00", slot terakhirnya adalah 7 (07:00-08:00)
      const slotEndHour = e.m > 0 ? e.h : e.h - 1;

      // 🔹 FILTER WAKTU (dari file 3)
      if (
        startHour < TIME_SLOT_BASE_HOUR || // Mulai sblm 07:00
        slotEndHour > TIME_SLOT_END_HOUR // Slot terakhir adalah stlh 20:00
      ) {
        console.warn(
          `Skipping event outside ${String(
            TIME_SLOT_BASE_HOUR,
          ).padStart(2, "0")}:00-${String(TIME_SLOT_END_HOUR + 1).padStart(
            2,
            "0",
          )}:00 range:`,
          ev,
        );
        return;
      }

      // Jam 07:00 adalah baris 1, 08:00 baris 2, dst.
      const gridRowStart = startHour - TIME_SLOT_BASE_HOUR + 1;
      const gridRowSpan = slotEndHour - startHour + 1;

      if (gridRowSpan < 1) {
        console.warn("Skipping event with invalid span:", ev);
        return;
      }

      if (!newSchedule[ev.dateKey]) newSchedule[ev.dateKey] = [];
      newSchedule[ev.dateKey].push({
        ...ev,
        gridRowStart,
        gridRowSpan,
        startHour,
        endHour: slotEndHour + 1, // endHour untuk logic overlap (misal 21)
      });
    });

    // --- Handle Overlaps per Supervisor (Logika dari Dashboard dipertahankan) ---
    for (const dateKey in newSchedule) {
      const events = newSchedule[dateKey];
      const supervisorGroups: Record<string, any[]> = {};

      events.forEach((ev) => {
        if (!supervisorGroups[ev.supervisor_name])
          supervisorGroups[ev.supervisor_name] = [];
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

    console.log("📊 Processed Schedule Map (with overlaps):", newSchedule);
    setScheduleMap(newSchedule);

    // --- Buat SupervisorMap (Logika dari Dashboard dipertahankan) ---
    const newSupervisorMap: Record<string, string[]> = {};
    for (const date in newSchedule) {
      newSupervisorMap[date] = [
        ...new Set(newSchedule[date].map((e) => e.supervisor_name)),
      ].sort();
    }
    console.log("👨‍💼 Processed Supervisor Map:", newSupervisorMap);
    setSupervisorMap(newSupervisorMap);
  }, [isLoading, rawSchedule, timeSlots.length, TIME_SLOT_BASE_HOUR, TIME_SLOT_END_HOUR]); // Dependensi diperbarui

  // --- Handle Export (Tetap sama) ---
  const handleExport = () => {
    console.log("Exporting Excel...");
    console.log("Start:", startDate);
    console.log("End:", endDate);
    // ...
  };

  // --- Hitung lebar per hari (Logika dari Dashboard dipertahankan) ---
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
    const totalCols =
      Object.values(supervisorSubCols).reduce((a, b) => a + b, 0) || 1;
    return `minmax(${totalCols * 150}px, ${totalCols}fr)`;
  });

  // --- 🔹 RENDER KOMPONEN (Layout Penuh) 🔹 ---
  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 font-sans">
      <CustomAlertModal
        message={alertMessage}
        onClose={() => setAlertMessage("")}
      />

      <main className="p-8 space-y-6">
        {/* Header (Tetap sama) */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2 text-gray-900">
              Weekly Schedule
            </h2>
            <p className="text-gray-600">
              View and manage worker schedules from Google Sheets
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E63946] hover:bg-[#d62828] transition text-white font-semibold">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add Schedule
          </button>
        </div>

        {/* 🔹 Layout Utama (Full width, dari file 3) 🔹 */}
        {/* 🔹 KONTROL LOADING DI SINI 🔹 */}
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          // 🔹 Hapus layout grid 1/4 + 3/4
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition">
            <div className="overflow-auto max-h-[80vh]">
              {/* Grid Utama (Logika dari Dashboard dipertahankan) */}
              <div
                className="grid"
                style={{
                  gridTemplateColumns: `120px ${dayWidths.join(" ")}`,
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
                {displayedDates.map((w) => (
                  <div
                    key={w.formatted}
                    className="sticky top-0 px-6 py-4 text-center text-sm font-semibold text-gray-700 bg-gray-100 border-b border-gray-200 z-20"
                  >
                    {w.day},{" "}
                    {w.date.toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </div>
                ))}

                {/* Baris 2: Supervisor (Logika dari Dashboard) */}
                {displayedDates.map((d, dayIndex) => {
                  const events = scheduleMap[d.formatted] || [];
                  const supervisors = supervisorMap[d.formatted] || [];
                  const supervisorSubCols: Record<string, number> = {};
                  supervisors.forEach((sup) => {
                    const supEvents = events.filter(
                      (e) => e.supervisor_name === sup,
                    );
                    supervisorSubCols[sup] =
                      supEvents.length > 0
                        ? Math.max(
                            ...supEvents.map((e) => e.totalSubColumns || 1),
                          )
                        : 1;
                  });
                  const totalSubCols =
                    Object.values(supervisorSubCols).reduce(
                      (a, b) => a + b,
                      0,
                    ) || 1;

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
                          gridTemplateColumns: `repeat(${totalSubCols}, minmax(150px, 1fr))`,
                        }}
                      >
                        {supervisors.length > 0 ? (
                          supervisors.map((name) => {
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
                      className={`px-4 py-2 text-sm font-medium text-gray-900 border-r border-b border-gray-100 bg-gray-50 box-border`}
                      style={{ height: `${TIME_SLOT_HEIGHT}px` }}
                    >
                      {slot}
                    </div>
                  ))}
                </div>

                {/* Kolom 2-dst: Kolom Hari (Logika dari Dashboard) */}
                {displayedDates.map((d, dayIndex) => {
                  const events = scheduleMap[d.formatted] || [];
                  const supervisors = supervisorMap[d.formatted] || [];
                  const supervisorSubCols: Record<string, number> = {};
                  supervisors.forEach((sup) => {
                    const supEvents = events.filter(
                      (e) => e.supervisor_name === sup,
                    );
                    supervisorSubCols[sup] =
                      supEvents.length > 0
                        ? Math.max(
                            ...supEvents.map((e) => e.totalSubColumns || 1),
                          )
                        : 1;
                  });
                  const totalSubCols =
                    Object.values(supervisorSubCols).reduce(
                      (a, b) => a + b,
                      0,
                    ) || 1;

                  return (
                    <div
                      key={d.formatted}
                      className={`relative grid ${
                        dayIndex % 2 === 0 ? "bg-gray-50" : "bg-white"
                      }`}
                      style={{
                        gridTemplateRows: `repeat(${timeSlots.length}, ${TIME_SLOT_HEIGHT}px)`,
                        gridTemplateColumns: `repeat(${totalSubCols}, minmax(150px, 1fr))`,
                        gridColumnStart: dayIndex + 2,
                        gridRowStart: 3,
                        borderLeft: "1px solid #e5e7eb",
                      }}
                    >
                      {/* Latar belakang garis-garis (Grid Cell) */}
                      {Array.from({
                        length: timeSlots.length * totalSubCols,
                      }).map((_, i) => {
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
                              col < totalSubCols
                                ? "border-r border-gray-100"
                                : ""
                            }`}
                          />
                        );
                      })}

                      {/* Render Event Jadwal (Logika dari Dashboard) */}
                      {events.map((ev) => {
                        const supIndex = supervisors.indexOf(
                          ev.supervisor_name,
                        );
                        if (supIndex === -1) return null;
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
    zIndex: 5,
    position: "relative",
  }}
  className="group cursor-pointer"
  onClick={() => {
    onEditSchedule({
      dateKey: d.formatted,
      supervisor_name: ev.supervisor_name,
      start: ev.start,
      end: ev.end,
      workers: ev.workers,
      location: ev.workers[0]?.tempat || ""
    });
  }}
>
  <div className="flex-1 min-w-0 p-2 border border-blue-200 rounded-lg bg-blue-50 shadow-sm overflow-hidden h-full relative transition hover:shadow-lg hover:bg-blue-100">
    <div className="text-blue-700 font-semibold mb-1 text-xs truncate">
      {ev.supervisor_name}
    </div>

    {ev.workers.map((w: any, j: number) => (
      <div key={j} className="text-xs text-gray-700 leading-tight truncate">
        • {w.worker_name} —{" "}
        <span className="font-medium">{w.jobdesc_name}</span>
      </div>
    ))}

    <div className="absolute inset-0 flex items-center justify-center bg-blue-600 bg-opacity-0 group-hover:bg-opacity-10 transition-all pointer-events-none">
      <span className="opacity-0 group-hover:opacity-100 text-blue-700 font-bold text-sm flex items-center gap-1 transition-opacity bg-white px-3 py-1 rounded-full shadow-lg">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.586-9.414a2 2 0 112.828 2.828L11 15l-4 1 1-4 8.414-8.414z" />
        </svg>
        Click to Edit
      </span>
    </div>
  </div>
</div>

                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 🔹 Filter + Export (Logika dari file 3) 🔹 */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* SATU Date Picker */}
                <div className="flex flex-col">
                  <label className="text-sm text-gray-700 mb-1">
                    Tanggal Mulai (Rentang 7 Hari)
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      const newStartStr = e.target.value;
                      if (!newStartStr) {
                        setStartDate("");
                        setEndDate("");
                        return;
                      }
                      // Parse sebagai UTC
                      const newStartDate = new Date(newStartStr + "T00:00:00");
                      const newEndDate = new Date(newStartDate);
                      // Tambah 6 hari untuk total 7 hari
                      newEndDate.setDate(newStartDate.getDate() + 6);
                      const newEndStr = newEndDate.toISOString().split("T")[0];

                      setStartDate(newStartStr);
                      setEndDate(newEndStr);
                    }}
                    className="px-3 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                {/* HAPUS End Date Picker */}
              </div>

              <button
                onClick={handleExport}
                className="px-5 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition"
              >
                Export Excel
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
