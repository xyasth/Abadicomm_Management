import { useEffect, useState } from "react";

export default function Dashboard() {
  const [workers, setWorkers] = useState<any[]>([]); // biar ga error TS

  useEffect(() => {
    window.electronAPI.getWorkers().then((data) => {
      setWorkers(data);
    });
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Dashboard</h1>

      <table className="table-auto border w-full">
        <thead className="bg-gray-200">
          <tr>
            <th className="border p-2">ID</th>
            <th className="border p-2">Nama</th>
            <th className="border p-2">Password</th>
          </tr>
        </thead>
        <tbody>
          {workers.map((w, i) => (
            <tr key={i}>
              <td className="border p-2">{w.id}</td>
              <td className="border p-2">{w.name}</td>
              <td className="border p-2">{w.password}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
