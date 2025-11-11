"use client"

import { useState, useEffect } from "react"
import { User, UserCheck, ArrowLeft, Mail, Lock } from "lucide-react"

type Props = {
    onNavigate: (page: "login" | "register") => void;
    onCancel: () => void;
    isAdminRegistering: boolean;
}

type RegisterResponse = {
    success: boolean;
    message: string;
}

export default function Register({ onNavigate, onCancel, isAdminRegistering }: Props) {
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [password_confirmation, setPasswordConfirmation] = useState("")

    const [role, setRole] = useState("2");
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [successMessage, setSuccessMessage] = useState("")

    useEffect(() => {
        setError("");
        setSuccessMessage("");
        setName("");
        setEmail("");
        setPassword("");
        setPasswordConfirmation("");
        setRole("2");
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSuccessMessage("");

        if (!name || !email || !password || !password_confirmation) {
            setError("All fields are required.")
            return
        }

        if (password !== password_confirmation) {
            setError("Passwords must match.");
            return;
        }

        setError("")
        setIsLoading(true)

        try {
            const roleIdInt = parseInt(role, 10);

            if (isNaN(roleIdInt) || roleIdInt < 1 || roleIdInt > 3) {
                setError("Invalid role selected. Please select a valid role.");
                setIsLoading(false);
                return;
            }

            const data = await window.electronAPI.register(
                name,
                roleIdInt,
                email,
                password,
                password_confirmation
            );

            const registerData: RegisterResponse = data as RegisterResponse;

            console.log("Registration successful:", registerData.message);

            setSuccessMessage(registerData.message || "Registration successful!");

            setName("");
            setEmail("");
            setPassword("");
            setPasswordConfirmation("");
            setRole("2");

            setTimeout(() => {
                if (isAdminRegistering) {
                    onCancel();
                } else {
                    onNavigate('login');
                }
            }, 1500);

        } catch (apiError: any) {
            console.error("Registration failed:", apiError);
            setIsLoading(false);
            setError(apiError.message || "An unexpected error occurred during registration. Check server logs.");
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
            <div className="p-4">
                <button
                    onClick={goToDashboard}
                    className="flex items-center text-sm font-medium text-gray-600 hover:text-[#E63946] transition"
                >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to Dashboard
                </button>
            </div>
        )}

        <div className="flex items-center justify-center pt-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
                <div className="p-8 space-y-6">
                    <div className="text-center">
                        <h2 className="text-3xl font-extrabold text-[#0066FF]">
                            {isAdminRegistering ? "Register New Worker" : "Create Account"}
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Enter details to register.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
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
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter email address"
                                    required
                                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent transition"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                            <select
                                id="role"
                                name="role"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full px-3 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent transition"
                            >
                                <option value="1">Supervisor</option>
                                <option value="2">Karyawan</option>
                                <option value="3">Admin</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
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
                                    placeholder="Enter password"
                                    required
                                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent transition"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="password_confirmation"
                                    name="password_confirmation"
                                    type="password"
                                    value={password_confirmation}
                                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                                    placeholder="Confirm password"
                                    required
                                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent transition"
                                />
                            </div>
                        </div>

                        {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                        {successMessage && <p className="text-sm text-green-600 text-center">{successMessage}</p>}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full flex justify-center items-center gap-3 py-3 px-4 rounded-lg text-white font-semibold transition ${
                                isLoading
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-[#0066FF] hover:bg-[#0052cc]"
                            }`}
                        >
                            <UserCheck size={18} />
                            {isLoading ? "Registering..." : (isAdminRegistering ? "Register Worker" : "Create Account")}
                        </button>

                        {!isAdminRegistering && (
                            <div className="text-sm text-center">
                                <p className="text-gray-600">
                                    Already have an account?{' '}
                                    <button
                                        type="button"
                                        onClick={goToLogin}
                                        className="font-medium text-[#0066FF] hover:text-[#0052cc]"
                                    >
                                        Login here
                                    </button>
                                </p>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
      </div>
    )
}
