/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState } from "react";
// 🔹 HAPUS import { Plus } from "lucide-react";

// Tipe data untuk event yang sudah diproses
interface ProcessedEvent {
  id: string; // Kunci unik untuk event
  supervisor_name: string;
  workers: any[];
  date: Date;
  startTime: string;
  endTime: string;
  // Properti untuk penempatan di CSS Grid
  gridRowStart: number; // Baris grid ke-berapa (mulai dari 1)
  gridRowSpan: number; // Durasi dalam baris (misal: 4 jam = 4 baris)
}

// Tipe data untuk tabel jadwal baru (Dikelompokkan per hari)
// Kuncinya adalah string tanggal "YYYY-MM-DD"
type ScheduleMap = Record<string, ProcessedEvent[]>;

// Tipe data untuk map supervisor per hari
// Kuncinya adalah string tanggal "YYYY-MM-DD", nilainya array nama supervisor
type SupervisorMap = Record<string, string[]>;

/**
 * Komponen Modal Alert Kustom
 * Menggantikan window.alert() yang mengganggu
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

export default function Jadwal() {
  const [rawSchedule, setRawSchedule] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [scheduleMap, setScheduleMap] = useState<ScheduleMap>({});
  const [supervisorMap, setSupervisorMap] = useState<SupervisorMap>({}); // 🔹 STATE BARU
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [alertMessage, setAlertMessage] = useState<string>(""); // 🔹 STATE UNTUK ALERT

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
        date: d,
        formatted: d.toISOString().split("T")[0],
      };
    });
  }

  const generateDateRange = (start: string, end: string) => {
    if (!start || !end) return [];
    // Parse tanggal sebagai UTC untuk menghindari masalah timezone
    const startD = new Date(start + "T00:00:00");
    const endD = new Date(end + "T00:00:00");
    const range: any[] = [];

    endD.setDate(endD.getDate() + 1); // Agar 'end' inklusif

    for (let d = new Date(startD); d < endD; d.setDate(d.getDate() + 1)) {
      range.push({
        day: d.toLocaleDateString("id-ID", { weekday: "long" }),
        date: new Date(d),
        formatted: d.toISOString().split("T")[0],
      });
    }
    return range;
  };

  const generateTimeSlots = () => {
    const hours: string[] = [];
    // 🔹 Ubah jam 00:00 - 23:00 (24 jam)
    for (let h = 0; h < 24; h++) {
      const start = String(h).padStart(2, "0");
      const end = String(h + 1).padStart(2, "0");
      hours.push(`${start}:00 - ${end}:00`);
    }
    return hours;
  };

  const timeSlots = generateTimeSlots(); // [ "00:00 - 01:00", ... ]
  const displayedDates = generateDateRange(startDate, endDate);
  const TIME_SLOT_BASE_HOUR = 0; // Jam mulai grid (0 untuk 00:00)
  const TIME_SLOT_HEIGHT = 60; // Tinggi per jam dalam px

  // --- Inisialisasi Tanggal ---
  useEffect(() => {
    const weekDates = getCurrentWeekDates();
    setStartDate(weekDates[0].formatted);
    setEndDate(weekDates[6].formatted);
  }, []);

  // --- 🔹 LOGIKA PARSING (Tetap sama) 🔹 ---
  const parseScheduleData = (schedules: any[]): ScheduleMap => {
    const tempGroupedEvents: Record<string, any> = {};

    const parseHourMin = (timeStr: string) => {
      const sep = timeStr.includes(":") ? ":" : timeStr.includes(".") ? "." : null;
      if (!sep) return { hour: parseInt(timeStr, 10), min: 0 };
      const [h, m] = timeStr.split(sep);
      return { hour: parseInt(h || "0", 10), min: parseInt(m || "0", 10) };
    };

    // 1. Kelompokkan pekerja ke dalam 'event' unik
    schedules.forEach((item) => {
      if (!item.date || !item.supervisor_name || !item.start_time) {
        console.warn("Skipping incomplete schedule item:", item);
        return;
      }
      const dateKey = new Date(item.date).toISOString().split("T")[0];
      const eventKey = `${dateKey}_${item.supervisor_name}_${item.start_time}`;

      if (!tempGroupedEvents[eventKey]) {
        tempGroupedEvents[eventKey] = {
          id: eventKey,
          supervisor_name: item.supervisor_name,
          workers: [],
          date: new Date(item.date),
          startTime: item.start_time,
          endTime: item.end_time,
        };
      }
      tempGroupedEvents[eventKey].workers.push({
        jobdesc_name: item.jobdesc_name,
        worker_name: item.worker_name,
        tempat: item.tempat,
      });
    });

    // 2. Proses event menjadi 'ScheduleMap' yang siap di-render
    const newScheduleMap: ScheduleMap = {};

    Object.values(tempGroupedEvents).forEach((event: any) => {
      const { hour: sH, min: sM } = parseHourMin(event.startTime);
      const { hour: eH, min: eM } = parseHourMin(event.endTime);

      const startSlotHour = sH;
      const endSlotHour = eM > 0 ? eH : eH - 1;

      // Jam 00:00 adalah baris 1, 01:00 baris 2, dst.
      const gridRowStart = startSlotHour - TIME_SLOT_BASE_HOUR + 1;
      const gridRowSpan = endSlotHour - startSlotHour + 1;

      if (
        gridRowStart < 1 ||
        gridRowStart > timeSlots.length ||
        gridRowSpan < 1
      ) {
        console.warn("Skipping event outside time range:", event);
        return;
      }

      const dateKey = event.date.toISOString().split("T")[0];
      if (!newScheduleMap[dateKey]) {
        newScheduleMap[dateKey] = [];
      }

      newScheduleMap[dateKey].push({
        ...event,
        gridRowStart: gridRowStart,
        gridRowSpan: gridRowSpan,
      });
    });

    return newScheduleMap;
  };

  // --- Pengambilan Data (Fetch) ---
  useEffect(() => {
    // Cek jika electronAPI ada
    if (window.electronAPI) {
      window.electronAPI
        .getSchedule()
        .then((data) => {
          console.log("📦 schedule data:", data);
          setRawSchedule(data); // Simpan data mentah
        })
        .catch((err) => console.error("Error fetching schedule:", err))
        .finally(() => setIsLoading(false));
    } else {
      console.warn("electronAPI not found. Using mock data.");
      // --- 🔹 MOCK DATA (untuk testing di browser) 🔹 ---
      const mockData = [
        // Monday
        {
          date: "2025-11-03",
          supervisor_name: "Pak Blengur",
          start_time: "02:00",
          end_time: "06:00",
          worker_name: "Pekerja A",
          jobdesc_name: "Cleaning",
        },
        {
          date: "2025-11-03",
          supervisor_name: "Pak Blengur",
          start_time: "02:00",
          end_time: "06:00",
          worker_name: "Pekerja B",
          jobdesc_name: "Security",
        },
        {
          date: "2025-11-03",
          supervisor_name: "Pak Freddy",
          start_time: "00:00",
          end_time: "04:00",
          worker_name: "Pekerja C",
          jobdesc_name: "Operator",
        },
        // Tuesday
        {
          date: "2025-11-04",
          supervisor_name: "Ibu Susi",
          start_time: "07:00",
          end_time: "10:00",
          worker_name: "Pekerja D",
          jobdesc_name: "Admin",
        },
        // Wednesday
        {
          date: "2025-11-05",
          supervisor_name: "Pak Freddy",
          start_time: "08:00",
          end_time: "11:00",
          worker_name: "Pekerja E",
          jobdesc_name: "Maintenance",
        },
        {
          date: "2025-11-05",
          supervisor_name: "Pak Blengur",
          start_time: "09:00",
          end_time: "12:00",
          worker_name: "Pekerja F",
          jobdesc_name: "Support",
        },
      ];
      // Inisialisasi tanggal agar mock data terlihat
      setStartDate("2025-11-03");
      setEndDate("2025-11-09");
      setRawSchedule(mockData);
      setIsLoading(false);
      // ------------------------------------------------
    }
  }, []);

  // --- Pemrosesan Data (scheduleMap) ---
  useEffect(() => {
    if (rawSchedule.length > 0) {
      const parsed = parseScheduleData(rawSchedule);
      console.log("📊 Processed Schedule Map:", parsed);
      setScheduleMap(parsed);
    }
  }, [rawSchedule]);

  // --- 🔹 EFEK BARU: Buat SupervisorMap saat scheduleMap berubah 🔹 ---
  useEffect(() => {
    const newSupervisorMap: SupervisorMap = {};
    // Loop setiap hari di scheduleMap
    for (const dateKey in scheduleMap) {
      const events = scheduleMap[dateKey];
      // Ambil semua nama supervisor unik dan urutkan
      const supervisors = [
        ...new Set(events.map((e) => e.supervisor_name)),
      ].sort();
      newSupervisorMap[dateKey] = supervisors;
    }
    console.log("👨‍💼 Processed Supervisor Map:", newSupervisorMap);
    setSupervisorMap(newSupervisorMap);
  }, [scheduleMap]);

  // --- Handle Export ---
  const handleExport = () => {
    console.log("Exporting Excel...");
    console.log("Start:", startDate);
    console.log("End:", endDate);
    console.log("Dates shown:", displayedDates.map((d) => d.formatted));
    // Logika export...
  };

  // --- 🔹 RENDER KOMPONEN (Struktur Grid Baru) 🔹 ---
  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 font-sans">
      <CustomAlertModal
        message={alertMessage}
        onClose={() => setAlertMessage("")}
      />
      <nav className="flex items-center justify-between bg-white border-b border-gray-200 px-8 py-4 shadow-sm">
        <div className="flex items-center gap-6">
          <a
            href="#"
            className="text-sm text-gray-700 hover:text-blue-600 font-medium"
          >
            Schedule
          </a>
          <a
            href="#"
            className="text-sm text-gray-700 hover:text-blue-600 font-medium"
          >
            Workers
          </a>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E63946] hover:bg-[#d62828] transition text-white font-semibold">
          {/* 🔹 GANTI <Plus /> dengan SVG inline 🔹 */}
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
      </nav>

      <main className="p-8 space-y-6">
        <div>
          <h2 className="text-3xl font-bold mb-2 text-gray-900">
            Weekly Schedule
          </h2>
          <p className="text-gray-600">
            View and manage worker schedules from Google Sheets
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition">
          <div className="overflow-auto max-h-[80vh]">
            {/* 🔹 Grid Utama 🔹
              Kolom 1: Jam (lebar 120px)
              Kolom 2-dst: Hari (lebar min 200px, bisa membesar)
            */}
            <div
              className="grid"
              style={{
                gridTemplateColumns: `120px repeat(${displayedDates.length}, minmax(min-content, 1fr))`, minWidth: "1200px",
              }}
            >
              {/* --- HEADER (2 Baris, Sticky) --- */}

              {/* Baris 1: Jam (Span 2 baris) */}
              <div
                className="sticky top-0 px-6 py-4 text-left text-sm font-semibold text-gray-700 bg-gray-50 border-b border-r border-gray-200 z-20 flex items-center"
                style={{ gridRow: "span 2 / span 2" }}
              >
                Jam
              </div>

              {/* Baris 1: Tanggal */}
              {displayedDates.map((w) => (
                <div
                  key={w.formatted}
                  className="sticky top-0 px-6 py-4 text-center text-sm font-semibold text-gray-700 bg-gray-100 border-b border-gray-200 z-10"
                >
                  {w.day},{" "}
                  {w.date.toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "short",
                  })}
                </div>
              ))}

              {/* Baris 2: Supervisor (Nested Grid) */}
              {displayedDates.map((w, dayIndex) => {
                const supervisors = supervisorMap[w.formatted] || [];
                const numCols = Math.max(1, supervisors.length);
                return (
                  <div
                    key={`${w.formatted}-supervisors`}
                    className="sticky top-[57px] bg-gray-50 border-b border-gray-200 z-10"
                    style={{
                      gridColumnStart: dayIndex + 2,
                      gridRowStart: 2,
                    }}
                  >
                    <div
                      className="grid h-full"
                      style={{
                        gridTemplateColumns: `repeat(${numCols}, minmax(150px, 1fr))`,
                      }}
                    >
                      {supervisors.length > 0 ? (
                        supervisors.map((name, i) => (
                          <div
                            key={name}
                            className={`px-3 py-2 text-xs font-medium text-gray-600 ${i < supervisors.length - 1
                              ? "border-r border-gray-200"
                              : ""
                              }`}
                          >
                            {name}
                          </div>
                        ))
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
                className="col-start-1"
                style={{
                  display: "grid",
                  gridTemplateRows: `repeat(${timeSlots.length}, ${TIME_SLOT_HEIGHT}px)`,
                  gridRowStart: 3, // Mulai setelah 2 baris header
                }}
              >
                {timeSlots.map((slot, i) => (
                  <div
                    key={i}
                    className={`px-4 py-2 text-sm font-medium text-gray-900 border-r border-b border-gray-100 bg-gray-50 box-border`} style={{ height: `${TIME_SLOT_HEIGHT}px` }}
                  >
                    {slot}
                  </div>
                ))}
              </div>

              {/* Kolom 2-dst: Kolom Hari (Tempat Jadwal) */}
              {displayedDates.map((day, dayIndex) => {
                const eventsForDay = scheduleMap[day.formatted] || [];
                const supervisors = supervisorMap[day.formatted] || [];
                const numCols = Math.max(1, supervisors.length);

                return (
                  // 🔹 Ini adalah NESTED GRID untuk 1 HARI 🔹
                  <div
                    key={day.formatted}
                    className="relative grid" // 'relative' agar event bisa diposisikan
                    style={{
                      gridTemplateRows: `repeat(${timeSlots.length}, ${TIME_SLOT_HEIGHT}px)`,
                      gridTemplateColumns: `repeat(${numCols}, minmax(150px, 1fr))`, // <- Perubahan di sini
                      gridColumnStart: dayIndex + 2,
                      gridRowStart: 3, // Mulai setelah 2 baris header
                      borderLeft: "1px solid #f3f4f6", // Garis antar hari
                    }}
                  >
                    {/* Latar belakang garis-garis (Grid Cell) */}
                    {Array.from({
                      length: timeSlots.length * numCols,
                    }).map((_, i) => {
                      // ✅ INI LOGIKA YANG BENAR (Row-by-row)
                      const row = Math.floor(i / numCols) + 1;
                      const col = (i % numCols) + 1;
                      return (
                        <div
                          key={`cell-${i}`}
                          style={{
                            gridRow: row,
                            gridColumn: col,
                            height: `${TIME_SLOT_HEIGHT}px`,
                          }}
                          className={`border-b border-gray-100 box-border ${col < numCols ? "border-r border-gray-100" : ""
                            }`}
                        />
                      );
                    })}

                    {/* Render Event Jadwal (Diposisikan di atas grid) */}
                    {eventsForDay.map((event) => {
                      // Cari di kolom supervisor mana event ini harus ditempatkan
                      const colIndex = supervisors.indexOf(
                        event.supervisor_name,
                      );
                      if (colIndex === -1) return null; // Seharusnya tidak terjadi

                      return (
                        <div
                          key={event.id}
                          className="" // 🔹 HAPUS 'relative p-1'
                          style={{
                            // Posisikan event di grid hari
                            gridRowStart: event.gridRowStart,
                            gridRowEnd: `span ${event.gridRowSpan}`,
                            gridColumnStart: colIndex + 1, // Kolom supervisor yg benar
                            // 🔹 HAPUS 'height'
                            // 🔹 TAMBAHKAN padding di sini (setara p-1)
                            padding: "0.25rem",
                          }}
                        >
                          <div className="flex-1 min-w-0 p-2 border border-blue-200 rounded-lg bg-blue-50 shadow-sm overflow-hidden h-full">
                            <div className="text-blue-700 font-semibold mb-1 text-xs truncate">
                              {event.supervisor_name}
                            </div>
                            {event.workers.map((w: any, j: number) => (
                              <div
                                key={j}
                                className="text-xs text-gray-700 leading-tight truncate"
                              >
                                • {w.worker_name} —{" "}
                                <span className="font-medium">
                                  {w.jobdesc_name}
                                </span>
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

          {/* 🔹 Filter + Export (Dengan Alert Baru) 🔹 */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Start Date Picker */}
              <div className="flex flex-col">
                <label className="text-sm text-gray-700 mb-1">Mulai</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    const newStart = e.target.value;
                    setStartDate(newStart);

                    const endInput = document.getElementById("endDateInput");
                    if (endInput) (endInput as HTMLInputElement).focus();
                  }}
                  className="px-3 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {/* End Date Picker */}
              <div className="flex flex-col">
                <label className="text-sm text-gray-700 mb-1">Sampai</label>
                <input
                  id="endDateInput"
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    const newEnd = e.target.value;
                    const diff =
                      (new Date(newEnd).getTime() -
                        new Date(startDate).getTime()) /
                      (1000 * 60 * 60 * 24);

                    if (diff < 0) {
                      setAlertMessage(
                        "Tanggal akhir tidak boleh sebelum tanggal mulai.",
                      );
                      return;
                    }

                    if (diff >= 7) {
                      setAlertMessage(
                        "Rentang waktu tidak boleh lebih dari 7 hari.",
                      );
                      return;
                    }

                    setEndDate(newEnd);
                  }}
                  className="px-3 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>

            <button
              onClick={handleExport}
              className="px-5 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition"
            >
              Export Excel
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
