"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signupSchema, type SignupInput } from "@/lib/validations/auth";
import { cn } from "@/lib/utils";

export function SignupForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    mode: "onSubmit",
  });

  const onSubmit = async (data: SignupInput) => {
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          username: data.username,
          password: data.password,
        }),
      });

      if (res.status === 400 || res.status === 409) {
        const body = await res.json();
        if (body.error && typeof body.error === "object") {
          for (const [field, messages] of Object.entries(body.error)) {
            if (
              Array.isArray(messages) &&
              messages.length > 0 &&
              (field === "email" || field === "username" || field === "password")
            ) {
              setError(field, { message: messages[0] as string });
            }
          }
        }
        setIsSubmitting(false);
        return;
      }

      if (res.status === 201) {
        // Auto-login after successful registration
        const result = await signIn("credentials", {
          email: data.email,
          password: data.password,
          redirect: false,
        });

        if (result?.ok) {
          router.push("/feed");
        }
      }
    } catch {
      setError("email", { message: "Something went wrong. Please try again." });
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

      {/* Username field */}
      <div>
        <label
          htmlFor="username"
          className="mb-2 block text-sm font-semibold text-slate-900"
        >
          Username
        </label>
        <input
          id="username"
          type="text"
          placeholder="letters, numbers, and underscores"
          disabled={isSubmitting}
          aria-invalid={errors.username ? "true" : undefined}
          aria-describedby={errors.username ? "username-error" : undefined}
          className={cn(
            "h-11 w-full rounded-lg border bg-gray-50 px-4 text-base text-slate-900 transition-colors",
            "focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/20 focus:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-60",
            errors.username
              ? "border-red-500 ring-2 ring-red-500/20"
              : "border-gray-300"
          )}
          {...register("username")}
        />
        {errors.username && (
          <span
            id="username-error"
            role="alert"
            className="mt-1 block text-sm font-semibold text-red-500"
          >
            {errors.username.message}
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
          placeholder="at least 8 characters"
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
          "Sign up"
        )}
      </button>

      {/* Alternate link */}
      <p className="text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-[var(--color-accent)] hover:underline"
        >
          Log in
        </Link>
      </p>
    </form>
  );
}
