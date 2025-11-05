"use client"

import { useState, useEffect } from "react"
import { User, Lock } from "lucide-react"

type Props = {
  onAuthSuccess: (role: string) => void;
  onNavigate: (page: "login" | "register") => void;
}

export default function Login({ onAuthSuccess, onNavigate }: Props) {
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    setError("");
    setName("");
    setPassword("");
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
      const data = await window.electronAPI.login(name, password);
      console.log("Login successful:", data.message);
      onAuthSuccess(data.role);
    } catch (apiError: any) {
      console.error("Login failed:", apiError);
      setError(apiError.message || "An error occurred during login.");
    } finally {
      setIsLoading(false);
    }
  }

  const goToRegister = () => {
    onNavigate('register');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-[#0066FF]">
              Welcome Back!
            </h2>
            <p className="text-gray-600 mt-2">
              Please login to your account.
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
                  placeholder="Enter your name"
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
                  placeholder="Enter your password"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent transition"
                />
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
                {isLoading ? "Processing..." : "Login"}
              </button>
            </div>
          </form>

          <div className="text-center">
            <button onClick={goToRegister} className="text-sm text-[#0066FF] hover:text-[#0052cc] font-medium transition">
              Don't have an account? Register
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
