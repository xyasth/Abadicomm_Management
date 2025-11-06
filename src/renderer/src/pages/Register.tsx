"use client"

import { useState, useEffect } from "react"
import { User, Lock, UserCheck, ArrowLeft } from "lucide-react"

type Props = {
  onNavigate: (page: "login" | "register") => void;
  onCancel: () => void;
  isAdminRegistering: boolean;
}

export default function Register({ onNavigate, onCancel, isAdminRegistering }: Props) {
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("2");
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    setError("");
    setName("");
    setPassword("");
    setRole("2");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !password) {
      setError("Name and password are required.")
      return
    }
    setError("")
    setIsLoading(true)

    try {
      const data = await window.electronAPI.register(name, password, role);
      console.log("Registration successful:", data.message);

      if (isAdminRegistering) {
        onCancel();
      } else {
        onNavigate('login');
      }

    } catch (apiError: any) {
      console.error("Registration failed:", apiError);
      setError(apiError.message || "An error occurred during registration.");
    } finally {
      setIsLoading(false);
    }
  }

  const goToLogin = () => {
    onNavigate('login');
  }

  const goToDashboard = () => {
    onCancel();
  }

  return (
    <div className="space-y-4">

      {isAdminRegistering && (
        <button
          onClick={goToDashboard}
          className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-blue-600 transition"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>
      )}

      <div className="flex items-center justify-center pt-4">

        <div className="max-w-md w-full bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">

          <div className="p-8 space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-[#0066FF]">
                {isAdminRegistering ? "Register New Worker" : "Create Account"}
              </h2>
              <p className="text-gray-600 mt-2">
                {isAdminRegistering ? "Add a new worker to the system." : "Get started by creating an account."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={isAdminRegistering ? "Enter worker's name" : "Enter your name"}
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent transition"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isAdminRegistering ? "Enter temporary password" : "Enter your password"}
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent transition"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserCheck className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="role"
                    name="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required
                    className="w-full pl-10 pr-10 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent transition appearance-none"
                  >
                    <option value="2">Karyawan</option>
                    <option value="1">Supervisor</option>

                    {isAdminRegistering && (
                      <option value="3">Admin</option>
                    )}

                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </div>
                </div>
              </div>

              {error && <p className="text-sm text-red-600 text-center">{error}</p>}

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full flex justify-center py-3 px-4 rounded-lg text-white font-semibold transition ${
                    isLoading ? "bg-gray-400 cursor-not-allowed" : "bg-[#E63946] hover:bg-[#d62828]"
                  }`}
                >
                  {isLoading ? "Processing..." : "Register"}
                </button>
              </div>
            </form>

            <div className="text-center">
              {!isAdminRegistering && (
                <button onClick={goToLogin} className="text-sm text-[#0066FF] hover:text-[#0052cc] font-medium transition">
                  Already have an account? Login
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
