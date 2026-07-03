"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";

// Minimal dev login. In dev, sign-in is email-only (see lib/auth.ts authorize).
// The seed created alice@kinetik.dev (owner) and bob@kinetik.dev (member).
const DEMO_USERS = [
  { email: "alice@kinetik.dev", label: "Alice (владелец)" },
  { email: "bob@kinetik.dev", label: "Bob (участник)" },
  { email: "newbie@kinetik.dev", label: "Новый пользователь (первый вход)" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("alice@kinetik.dev");
  const [pending, startTransition] = useTransition();

  function login(withEmail: string) {
    startTransition(async () => {
      await signIn("credentials", {
        email: withEmail,
        password: "dev",
        // Send to the root, which routes to the user's first board — or to
        // onboarding if they have none. (Never hard-code a specific board:
        // a new user isn't a member of it.)
        redirectTo: "/",
      });
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 p-4 dark:bg-neutral-950">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Kinetik</h1>
        <p className="mt-1 text-sm text-neutral-500">Вход в рабочее пространство</p>

        <label className="mt-6 block text-xs font-medium text-neutral-500">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
        />
        <button
          onClick={() => login(email)}
          disabled={pending || !email}
          className="mt-3 w-full rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
        >
          {pending ? "Входим…" : "Войти"}
        </button>

        <div className="mt-6 border-t border-neutral-200 pt-4 dark:border-neutral-800">
          <p className="mb-2 text-xs text-neutral-400">Быстрый вход (demo):</p>
          <div className="flex flex-col gap-2">
            {DEMO_USERS.map((u) => (
              <button
                key={u.email}
                onClick={() => login(u.email)}
                disabled={pending}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-left text-xs text-neutral-600 hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                {u.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
