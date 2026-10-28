import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo/agenthub-logo.svg";
import { api } from "../../lib/api";

function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.register(form);
      localStorage.setItem("token", data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper text-ink">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Left panel */}
        <div className="relative hidden overflow-hidden border-r border-black/10 bg-paper-deep lg:flex lg:flex-col lg:justify-between lg:p-10">
          <div className="pointer-events-none absolute right-0 top-1/3 h-96 w-96 rounded-full bg-gold/10 blur-[120px]" />

          <a href="/" className="relative flex items-center gap-2.5">
            <img src={logo} alt="AgentHub" className="h-10 w-10 object-contain" />
            <span className="text-xl font-bold tracking-tight">
              Agent<span className="text-forest">Hub</span>
            </span>
          </a>

          <div className="relative max-w-lg">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">
              Start your workspace
            </p>
            <h1 className="font-display mt-5 text-4xl font-semibold leading-tight text-ink">
              Turn one task into
              <span className="block text-stone-500">a coordinated workflow.</span>
            </h1>
            <p className="mt-5 text-sm leading-7 text-stone-600">
              Create your workspace and let the orchestrator coordinate
              specialized AI agents from research to review.
            </p>

            <div className="mt-8 space-y-3">
              {[
                "Decompose complex tasks",
                "Coordinate specialized agents",
                "Validate and review outputs",
              ].map((item, index) => (
                <div key={item} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gold/10 text-[10px] font-bold text-gold-light">
                    0{index + 1}
                  </span>
                  <span className="text-xs text-stone-500">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="relative text-xs text-stone-300">
            One workspace. Multiple specialists. One result.
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
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-gold">
                  Get started
                </p>
                <h2 className="mt-2 text-2xl font-bold text-ink">
                  Create your AgentHub account
                </h2>
                <p className="mt-2 text-sm text-stone-500">
                  Set up your account and start your first AI workflow.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-7 space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-xs font-medium text-stone-600"
                  >
                    Full name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Your name"
                    className="w-full rounded-xl border border-black/10 bg-paper px-4 py-3 text-sm text-ink outline-none transition placeholder:text-stone-300 focus:border-gold/50 focus:ring-2 focus:ring-gold/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="register-email"
                    className="mb-2 block text-xs font-medium text-stone-600"
                  >
                    Email
                  </label>
                  <input
                    id="register-email"
                    name="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-black/10 bg-paper px-4 py-3 text-sm text-ink outline-none transition placeholder:text-stone-300 focus:border-gold/50 focus:ring-2 focus:ring-gold/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="register-password"
                    className="mb-2 block text-xs font-medium text-stone-600"
                  >
                    Password
                  </label>

                  <div className="relative">
                    <input
                      id="register-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Create a password"
                      className="w-full rounded-xl border border-black/10 bg-paper px-4 py-3 pr-16 text-sm text-ink outline-none transition placeholder:text-stone-300 focus:border-gold/50 focus:ring-2 focus:ring-gold/10"
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

                <label className="flex items-start gap-2.5 pt-1">
                  <input
                    type="checkbox"
                    required
                    className="mt-0.5 h-3.5 w-3.5 rounded border-black/10 bg-paper accent-violet-500"
                  />
                  <span className="text-[11px] leading-5 text-stone-400">
                    I agree to the{" "}
                    <a href="#" className="text-stone-600 hover:text-ink">
                      Terms
                    </a>{" "}
                    and{" "}
                    <a href="#" className="text-stone-600 hover:text-ink">
                      Privacy Policy
                    </a>
                    .
                  </span>
                </label>

                {error && <p className="text-xs text-red-600">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-forest to-gold px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-gold/10 transition hover:-translate-y-0.5 disabled:opacity-50"
                >
                  {loading ? "Creating account..." : "Create account"}
                  <span className="transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </button>
              </form>

              <p className="mt-6 text-center text-xs text-stone-400">
                Already have an account?{" "}
                <a
                  href="/login"
                  className="font-medium text-forest transition hover:text-forest-light"
                >
                  Sign in
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

export default Register;
