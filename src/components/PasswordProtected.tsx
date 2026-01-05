"use client";

import { useState } from "react";
import { Lock, Loader2, Eye, EyeOff } from "lucide-react";

interface PasswordProtectedProps {
  type: "photo" | "album";
  slug: string;
  title: string;
  onSuccess: () => void;
}

export function PasswordProtected({
  type,
  slug,
  title,
  onSuccess,
}: PasswordProtectedProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsVerifying(true);

    try {
      const endpoint =
        type === "photo"
          ? `/api/photos/${slug}/verify`
          : `/api/albums/${slug}/verify`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "驗證失敗");
      }

      // 驗證成功，重新載入頁面
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "驗證失敗");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-xl shadow-lg p-8 border border-stone-200">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-stone-500" />
            </div>
            <h2 className="text-xl font-serif text-stone-800 mb-2">
              {title}
            </h2>
            <p className="text-sm text-stone-500">
              此{type === "photo" ? "照片" : "相簿"}受密碼保護
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm text-center">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="password" className="sr-only">
                密碼
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="請輸入密碼"
                  className="w-full px-4 py-3 pr-12 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500 text-center"
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isVerifying || !password}
              className="w-full py-3 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors disabled:bg-stone-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  驗證中...
                </>
              ) : (
                "解鎖"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
