import { LoginForm } from "@/components/auth/LoginForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log in - Chirp",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-[400px] px-4">
        <h1 className="mb-12 text-center text-[32px] font-semibold text-slate-900">
          Chirp
        </h1>
        <div className="rounded-xl bg-white p-6 sm:border sm:border-gray-300 sm:shadow-sm">
          <h2 className="mb-6 text-2xl font-semibold text-slate-900">
            Log in to Chirp
          </h2>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
