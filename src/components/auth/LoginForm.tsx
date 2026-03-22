"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { cn } from "@/lib/utils";

export function LoginForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: "onSubmit",
  });

  const onSubmit = async (data: LoginInput) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.ok) {
        router.push("/feed");
      } else {
        setServerError("Invalid email or password");
      }
    } catch {
      setServerError("Invalid email or password");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {/* Email field */}
      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-sm font-semibold text-slate-900"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          placeholder="you@example.com"
          disabled={isSubmitting}
          aria-invalid={errors.email ? "true" : undefined}
          aria-describedby={errors.email ? "email-error" : undefined}
          className={cn(
            "h-11 w-full rounded-lg border bg-gray-50 px-4 text-base text-slate-900 transition-colors",
            "focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/20 focus:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-60",
            errors.email
              ? "border-red-500 ring-2 ring-red-500/20"
              : "border-gray-300"
          )}
          {...register("email")}
        />
        {errors.email && (
          <span
            id="email-error"
            role="alert"
            className="mt-1 block text-sm font-semibold text-red-500"
          >
            {errors.email.message}
          </span>
        )}
      </div>

      {/* Password field */}
      <div>
        <label
          htmlFor="password"
          className="mb-2 block text-sm font-semibold text-slate-900"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          disabled={isSubmitting}
          aria-invalid={errors.password ? "true" : undefined}
          aria-describedby={errors.password ? "password-error" : undefined}
          className={cn(
            "h-11 w-full rounded-lg border bg-gray-50 px-4 text-base text-slate-900 transition-colors",
            "focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/20 focus:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-60",
            errors.password
              ? "border-red-500 ring-2 ring-red-500/20"
              : "border-gray-300"
          )}
          {...register("password")}
        />
        {errors.password && (
          <span
            id="password-error"
            role="alert"
            className="mt-1 block text-sm font-semibold text-red-500"
          >
            {errors.password.message}
          </span>
        )}
      </div>

      {/* Server error (generic login error per D-04) */}
      {serverError && (
        <p role="alert" className="text-sm font-semibold text-red-500">
          {serverError}
        </p>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className={cn(
          "h-11 w-full rounded-lg bg-[var(--color-accent)] font-semibold text-white transition-colors",
          "hover:bg-[var(--color-accent-hover)]",
          "focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:ring-offset-2",
          "active:scale-[0.98]",
          "disabled:cursor-not-allowed disabled:opacity-60"
        )}
      >
        {isSubmitting ? (
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : (
          "Log in"
        )}
      </button>

      {/* Alternate link */}
      <p className="text-center text-sm text-slate-500">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-semibold text-[var(--color-accent)] hover:underline"
        >
          Sign up
        </Link>
      </p>
    </form>
  );
}
