import { useState } from 'react'

function Versions(): React.JSX.Element {
  const [versions] = useState(window.electron.process.versions)

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">System Versions</h2>
      <ul className="space-y-3">
        <li className="flex items-center justify-between p-3 bg-gray-50 rounded">
          <span className="font-medium text-gray-700">Electron</span>
          <span className="text-gray-600">v{versions.electron}</span>
        </li>
        <li className="flex items-center justify-between p-3 bg-gray-50 rounded">
          <span className="font-medium text-gray-700">Chromium</span>
          <span className="text-gray-600">v{versions.chrome}</span>
        </li>
        <li className="flex items-center justify-between p-3 bg-gray-50 rounded">
          <span className="font-medium text-gray-700">Node</span>
          <span className="text-gray-600">v{versions.node}</span>
        </li>
      </ul>
    </div>
  )
}

export default Versions
