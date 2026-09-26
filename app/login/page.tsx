import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Document Assistant
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
            Sign in
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Access your workspaces and grounded chat. (Placeholder — auth
            coming later.)
          </p>
        </div>

        <form className="space-y-4" action="/dashboard">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-zinc-700"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-zinc-700"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2"
            />
          </div>
          <Link
            href="/dashboard"
            className="flex w-full items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
          >
            Continue to dashboard
          </Link>
        </form>

        <p className="mt-6 text-center text-xs text-zinc-400">
          No account yet? Registration will be added with real auth.
        </p>
      </div>
    </div>
  );
}
