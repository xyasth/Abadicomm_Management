"use client"

import { useState } from "react"
import { User, Lock } from "lucide-react"

type Mode = "login" | "register"

export default function AuthPage({ initialMode = "login" }: { initialMode?: Mode }) {
  const [isLoginMode, setIsLoginMode] = useState(initialMode === "login")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !password) {
      setError("Name and password are required.")
      return
    }
    setError("")
    setIsLoading(true)
    console.log(`Submitting as ${isLoginMode ? "Login" : "Register"}:`, { name, password })

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      if (isLoginMode) {
        console.log("Login successful (simulated)")
        // handle successful login (redirect, state update, etc.)
      } else {
        console.log("Registration successful (simulated)")
        // handle successful registration; optionally switch to login
        setIsLoginMode(true)
      }
    }, 1500)
  }

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode)
    setError("")
    setName("")
    setPassword("")
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-[#0066FF]">
              {isLoginMode ? "Welcome Back!" : "Create Account"}
            </h2>
            <p className="text-gray-600 mt-2">
              {isLoginMode ? "Please login to your account." : "Get started by creating an account."}
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
                {isLoading ? "Processing..." : isLoginMode ? "Login" : "Register"}
              </button>
            </div>
          </form>

          <div className="text-center">
            <button onClick={toggleMode} className="text-sm text-[#0066FF] hover:text-[#0052cc] font-medium transition">
              {isLoginMode ? "Don't have an account? Register" : "Already have an account? Login"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
