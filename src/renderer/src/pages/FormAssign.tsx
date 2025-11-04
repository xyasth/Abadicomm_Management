import React, { useState } from "react"

const AssignForm: React.FC = (): React.ReactElement => {
  const [tanggal, setTanggal] = useState("")
  const [waktuMulai, setWaktuMulai] = useState("")
  const [waktuAkhir, setWaktuAkhir] = useState("")
  const [Lokasi, setLokasi] = useState("")
  const [worker, setWorker] = useState("")
  const [jobdesc, setJobdesc] = useState("")
  const [ketua, setKetua] = useState("")

  // Dummy data
  const workers = ["Andi", "Budi", "Citra", "Dewi"]
  const jobdescs = ["PIC", "Regis", "Op", "Foto", "Mc"]
  const leaders = ["Slamet", "Tono", "Rina"]

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault()
    const data = { worker, tanggal, waktuMulai, waktuAkhir, Lokasi, jobdesc, ketua }
    console.log("Data dikirim:", data)
    alert("Data berhasil dikonfirmasi!")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-yellow-50 to-gray-100 p-6">
      <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-8 w-full max-w-2xl shadow-lg transition-all hover:shadow-xl">
        <h2 className="text-2xl font-semibold text-gray-700 text-center mb-6">
          Assign Worker Form
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Worker */}
          <div>
            <label className="block font-medium mb-2 text-gray-600">Worker</label>
            <select
              className="w-full bg-yellow-50 border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-yellow-300"
              value={worker}
              onChange={(e) => setWorker(e.target.value)}
            >
              <option value="">-- Pilih Worker --</option>
              {workers.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>

          {/* Hari tanggal & Lokasi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block font-medium mb-2 text-gray-600">Hari Tanggal</label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                onFocus={(e) => e.target.showPicker?.()}
                className="w-full bg-blue-50 border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer"
              />
            </div>
            <div>
              <label className="block font-medium mb-2 text-gray-600">Lokasi</label>
              <input
                type="text"
                value={Lokasi}
                onChange={(e) => setLokasi(e.target.value)}
                placeholder="Masukkan Lokasi"
                className="w-full bg-blue-50 border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
          </div>

          {/* Waktu mulai & akhir */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block font-medium mb-2 text-gray-600">Waktu Mulai</label>
              <input
                type="time"
                value={waktuMulai}
                onChange={(e) => setWaktuMulai(e.target.value)}
                onFocus={(e) => e.target.showPicker?.()}
                className="w-full bg-blue-50 border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer"
              />
            </div>
            <div>
              <label className="block font-medium mb-2 text-gray-600">Waktu Berakhir</label>
              <input
                type="time"
                value={waktuAkhir}
                onChange={(e) => setWaktuAkhir(e.target.value)}
                onFocus={(e) => e.target.showPicker?.()}
                className="w-full bg-blue-50 border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer"
              />
            </div>
          </div>

          {/* Jobdesc & Ketua */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block font-medium mb-2 text-gray-600">Jobdesc</label>
              <div className="flex gap-2">
                <select
                  className="flex-1 bg-yellow-50 border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-yellow-300"
                  value={jobdesc}
                  onChange={(e) => setJobdesc(e.target.value)}
                >
                  <option value="">-- Pilih Jobdesc --</option>
                  {jobdescs.map((j) => (
                    <option key={j} value={j}>
                      {j}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="bg-yellow-200 hover:bg-yellow-300 transition px-3 rounded-lg font-bold text-lg shadow-sm"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <label className="block font-medium mb-2 text-gray-600">Ketua</label>
              <div className="flex gap-2">
                <select
                  className="flex-1 bg-yellow-50 border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-yellow-300"
                  value={ketua}
                  onChange={(e) => setKetua(e.target.value)}
                >
                  <option value="">-- Pilih Ketua --</option>
                  {leaders.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="bg-yellow-200 hover:bg-yellow-300 transition px-3 rounded-lg font-bold text-lg shadow-sm"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Confirm */}
          <div className="text-center mt-6">
            <button
              type="submit"
              className="bg-gradient-to-r from-yellow-300 to-yellow-400 text-gray-700 font-semibold px-8 py-2.5 rounded-lg shadow-md hover:from-yellow-400 hover:to-yellow-500 transition-all"
            >
              Confirm
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AssignForm
