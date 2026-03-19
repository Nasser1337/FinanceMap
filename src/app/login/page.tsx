"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, Lock, User } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Ongeldige gebruikersnaam of wachtwoord");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("Er is een fout opgetreden. Probeer het opnieuw.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-2xl p-3 mx-auto mb-4 shadow-xl shadow-black/20 flex items-center justify-center">
            <Image src="/logo.png" alt="FinanceMap" width={56} height={56} className="object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-white">FinanceMap</h1>
          <p className="text-sm text-dark-400 mt-1">Meld je aan om verder te gaan</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1.5">
                Gebruikersnaam
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm transition-all"
                  placeholder="Voer gebruikersnaam in"
                  required
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1.5">
                Wachtwoord
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm transition-all"
                  placeholder="Voer wachtwoord in"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-xl">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Bezig met inloggen...
                </>
              ) : (
                "Inloggen"
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-dark-500 mt-6">
          FinanceMap v1.0 — Made by Nasser F. from{" "}
          <a href="https://lightfusion.be" target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:text-primary-300">
            Lightfusion.be
          </a>
        </p>
      </div>
    </div>
  );
}
