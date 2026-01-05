"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, XCircle, CheckCircle } from "lucide-react";
import Link from "next/link";

function PrivatePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [tokenName, setTokenName] = useState("");

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setStatus("error");
        setMessage("No access token provided");
        return;
      }

      try {
        const res = await fetch("/api/auth/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (res.ok) {
          setStatus("success");
          setTokenName(data.name || "");
          setMessage("Access granted! Redirecting...");

          // Redirect to home page after a short delay
          setTimeout(() => {
            router.push("/");
          }, 1500);
        } else {
          setStatus("error");
          setMessage(data.error || "Invalid or expired token");
        }
      } catch (error) {
        console.error("Token verification failed:", error);
        setStatus("error");
        setMessage("Failed to verify token. Please try again.");
      }
    };

    verifyToken();
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-stone-50 to-stone-100">
      <div className="text-center px-6">
        {status === "loading" && (
          <div className="space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-stone-400 mx-auto" />
            <p className="text-lg text-stone-600">Verifying access...</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-serif text-stone-900 mb-2">
                Welcome{tokenName ? `, ${tokenName}` : ""}!
              </h1>
              <p className="text-stone-600">{message}</p>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl font-serif text-stone-900 mb-2">
                Access Denied
              </h1>
              <p className="text-stone-600">{message}</p>
            </div>
            <Link
              href="/"
              className="inline-block px-6 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors"
            >
              Go to Homepage
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PrivatePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-stone-50 to-stone-100">
          <div className="text-center px-6">
            <Loader2 className="w-12 h-12 animate-spin text-stone-400 mx-auto" />
            <p className="text-lg text-stone-600 mt-4">Loading...</p>
          </div>
        </div>
      }
    >
      <PrivatePageContent />
    </Suspense>
  );
}
