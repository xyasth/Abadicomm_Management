"use client"

import { useState, useEffect } from "react"
import { LogIn } from "lucide-react"

type Props = {
  onAuthSuccess: (role: string) => void;
  onNavigate: (page: "login" | "register") => void;
}

export default function Login({ onAuthSuccess, onNavigate }: Props) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    setError("");
  }, []);

  const handleGoogleLogin = async () => {
    setError("")
    setIsLoading(true)

    try {
      const data = await window.electronAPI.googleLoginStart();
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
              Please login with your Google account.
            </p>
          </div>

          <div>
            <button
              onClick={handleGoogleLogin}
              type="button"
              disabled={isLoading}
              className={`w-full flex justify-center items-center gap-3 py-3 px-4 rounded-lg text-white font-semibold transition ${
                isLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[#E63946] hover:bg-[#d62828]"
              }`}
            >
              <LogIn size={18} />
              {isLoading ? "Waiting for Google..." : "Login with Google"}
            </button>
          </div>

          {error && <p className="text-sm text-red-600 text-center">{error}</p>}

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
