import Topbar from "../components/dashboard/Topbar";

const agents = [
  ["Research","Analyzing requirements","Completed",100,"bg-emerald-500"],
  ["Coding","Generating implementation","Running",68,"bg-forest"],
  ["Database","Preparing schema","Running",42,"bg-gold"],
  ["Testing","Waiting for dependencies","Queued",0,"bg-stone-300"],
  ["Review","Waiting for test results","Queued",0,"bg-stone-300"],
];

function Workspace() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <Topbar />
      <main>
        <header className="flex min-h-[74px] items-center justify-between border-b border-black/10 px-5 py-4 sm:px-8">
          <div><p className="text-[10px] uppercase tracking-[0.16em] text-forest">Workspace</p><h1 className="mt-1 text-base font-semibold">New AI workflow</h1></div>
          <button className="rounded-lg border border-black/10 bg-black/[0.03] px-4 py-2.5 text-xs text-stone-600">Save draft</button>
        </header>

        <div className="mx-auto max-w-7xl p-5 sm:p-8">
          <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <section className="rounded-2xl border border-black/10 bg-white p-5 sm:p-6">
              <p className="text-xs font-semibold">Task input</p>
              <p className="mt-1 text-[11px] text-stone-400">Describe the complete outcome. The orchestrator handles decomposition.</p>
              <textarea defaultValue="Build a secure REST API with database integration, authentication, and automated tests." rows={7} className="mt-5 w-full resize-none rounded-xl border border-black/10 bg-paper p-4 text-sm leading-7 text-stone-800 outline-none focus:border-forest/40"/>
              <div className="mt-5 flex flex-wrap gap-2">{["Software development","Multi-agent","Testing required"].map(x=><span key={x} className="rounded-full border border-black/10 px-3 py-1.5 text-[10px] text-stone-500">{x}</span>)}</div>
              <button className="mt-6 w-full rounded-xl bg-gradient-to-r from-forest to-gold px-5 py-3.5 text-sm font-semibold text-white">Run workflow →</button>
            </section>

            <section className="rounded-2xl border border-black/10 bg-white p-5 sm:p-6">
              <p className="text-xs font-semibold">Workflow plan</p>
              <p className="mt-1 text-[11px] text-stone-400">Orchestrator-generated pipeline.</p>
              <div className="mt-6 space-y-3">{[
                ["01","Understand task","Orchestrator"],["02","Research context","Research Agent"],["03","Implement solution","Coding Agent"],["04","Prepare data layer","Database Agent"],["05","Validate output","Testing Agent"],["06","Final quality review","Review Agent"]
              ].map(([n,t,o],i)=><div key={n} className="flex gap-3"><div className="flex flex-col items-center"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/[0.04] text-[9px] text-stone-500">{n}</span>{i<5&&<span className="mt-1 h-5 w-px bg-black/5"/>}</div><div className="pt-1"><p className="text-[11px] text-stone-800">{t}</p><p className="mt-1 text-[9px] text-stone-300">{o}</p></div></div>)}</div>
            </section>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.8fr]">
            <section className="rounded-2xl border border-black/10 bg-white p-5 sm:p-6">
              <div className="flex justify-between"><p className="text-xs font-semibold">Agent execution</p><span className="text-[10px] text-stone-400">2 running · 1 complete</span></div>
              <div className="mt-5 space-y-3">{agents.map(([n,t,s,p,d])=>
                <div key={n} className="rounded-xl border border-black/5 bg-black/[0.02] p-4">
                  <div className="flex justify-between"><div className="flex items-center gap-2.5"><span className={`h-1.5 w-1.5 rounded-full ${d}`}/><p className="text-xs text-stone-800">{n} Agent</p></div><span className="text-[10px] text-stone-400">{s}</span></div>
                  <p className="mt-2 text-[10px] text-stone-400">{t}</p>
                  <div className="mt-3 h-1 overflow-hidden rounded-full bg-black/5"><div className="h-full rounded-full bg-forest/60" style={{width:`${p}%`}}/></div>
                </div>
              )}</div>
            </section>

            <section className="rounded-2xl border border-black/10 bg-white p-5 sm:p-6">
              <div className="flex justify-between"><p className="text-xs font-semibold">Execution logs</p><span className="text-[9px] text-emerald-600">streaming</span></div>
              <div className="mt-5 rounded-xl border border-black/5 bg-stone-50 p-4 font-mono text-[9px] leading-5">
                <p><span className="text-stone-300">00:00:01</span> <span className="text-forest">[orchestrator]</span> <span className="text-stone-500">Task received</span></p>
                <p><span className="text-stone-300">00:00:03</span> <span className="text-forest">[orchestrator]</span> <span className="text-stone-500">Plan generated</span></p>
                <p><span className="text-stone-300">00:00:05</span> <span className="text-gold">[research]</span> <span className="text-stone-500">Requirements analyzed</span></p>
                <p><span className="text-stone-300">00:00:08</span> <span className="text-forest">[coding]</span> <span className="text-stone-500">Implementation started</span></p>
                <p><span className="text-stone-300">00:00:09</span> <span className="text-forest-light">[database]</span> <span className="text-stone-500">Schema preparation started</span></p>
              </div>
              <div className="mt-5 rounded-xl border border-emerald-500/10 bg-emerald-500/[0.03] p-4"><p className="text-[10px] uppercase tracking-[0.14em] text-emerald-600">Result preview</p><p className="mt-2 text-xs leading-5 text-stone-500">Final response and artifacts will appear here after testing and review.</p></div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
export default Workspace;
