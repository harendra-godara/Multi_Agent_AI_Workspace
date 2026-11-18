import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo/agenthub-logo.svg";
import { api } from "../../lib/api";

function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.login(form);
      localStorage.setItem("token", data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper text-ink">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Left panel */}
        <div className="relative hidden overflow-hidden border-r border-black/10 bg-paper-deep lg:flex lg:flex-col lg:justify-between lg:p-10">
          <div className="pointer-events-none absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 rounded-full bg-forest/10 blur-[120px]" />

          <a href="/" className="relative flex items-center gap-2.5">
            <img src={logo} alt="AgentHub" className="h-10 w-10 object-contain" />
            <span className="text-xl font-bold tracking-tight">
              Agent<span className="text-forest">Hub</span>
            </span>
          </a>

          <div className="relative max-w-lg">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest">
              Multi-Agent AI Workspace
            </p>
            <h1 className="font-display mt-5 text-4xl font-semibold leading-tight text-ink">
              Pick up where your
              <span className="block text-stone-500">AI workflow left off.</span>
            </h1>
            <p className="mt-5 text-sm leading-7 text-stone-600">
              Access your workspaces, orchestrated tasks, agent runs, logs,
              reviews, and generated artifacts from one place.
            </p>

            <div className="mt-8 flex flex-wrap gap-2">
              {["Orchestrator", "Research", "Coding", "Testing", "Review"].map(
                (item) => (
                  <span
                    key={item}
                    className="rounded-full border border-black/10 bg-black/[0.03] px-3 py-1.5 text-[10px] text-stone-500"
                  >
                    {item}
                  </span>
                )
              )}
            </div>
          </div>

          <p className="relative text-xs text-stone-300">
            Build. Coordinate. Validate.
          </p>
        </div>

        {/* Form */}
        <div className="flex items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center justify-center lg:hidden">
              <a href="/" className="flex items-center gap-2.5">
                <img src={logo} alt="AgentHub" className="h-10 w-10 object-contain" />
                <span className="text-xl font-bold">
                  Agent<span className="text-forest">Hub</span>
                </span>
              </a>
            </div>

            <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-2xl shadow-black/20 sm:p-8">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-forest">
                  Welcome back
                </p>
                <h2 className="mt-2 text-2xl font-bold text-ink">
                  Sign in to AgentHub
                </h2>
                <p className="mt-2 text-sm text-stone-500">
                  Continue working on your AI development workflows.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-xs font-medium text-stone-600"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-black/10 bg-paper px-4 py-3 text-sm text-ink outline-none transition placeholder:text-stone-300 focus:border-forest/50 focus:ring-2 focus:ring-forest/10"
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="block text-xs font-medium text-stone-600"
                    >
                      Password
                    </label>
                    <a
                      href="/forgot-password"
                      className="text-[11px] text-forest transition hover:text-forest-light"
                    >
                      Forgot password?
                    </a>
                  </div>

                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      className="w-full rounded-xl border border-black/10 bg-paper px-4 py-3 pr-16 text-sm text-ink outline-none transition placeholder:text-stone-300 focus:border-forest/50 focus:ring-2 focus:ring-forest/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-stone-400 transition hover:text-stone-800"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                {error && <p className="text-xs text-red-600">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-forest to-gold px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-forest/10 transition hover:-translate-y-0.5 disabled:opacity-50"
                >
                  {loading ? "Signing in..." : "Sign in"}
                  <span className="transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </button>
              </form>

              <p className="mt-6 text-center text-xs text-stone-400">
                Don't have an account?{" "}
                <a
                  href="/register"
                  className="font-medium text-forest transition hover:text-forest-light"
                >
                  Create one
                </a>
              </p>
            </div>

            <a
              href="/"
              className="mt-6 block text-center text-xs text-stone-300 transition hover:text-stone-600"
            >
              ← Back to AgentHub
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
