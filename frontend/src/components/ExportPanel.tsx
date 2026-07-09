export default function ExportPanel({ result, onDownloadReport, onDownloadJson, onCopySummary }) {
  if (!result) return null
  return (
    <div className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
      <div className="card p-6">
        <p className="label">Export layer</p>
        <h3 className="mt-2 text-lg font-semibold text-ink">Reviewable outputs</h3>
        <p className="mt-2 text-sm leading-6 text-muted">The system produces artifacts that can be inspected outside the app: a guarded memo, full JSON payload and source-aware analysis summary.</p>
        <div className="mt-5 grid gap-3">
          <button onClick={onDownloadReport} className="rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0E172B]">Download Markdown report</button>
          <button onClick={onDownloadJson} className="rounded-xl border border-line bg-white px-4 py-3 text-sm font-semibold text-muted transition hover:border-[#BFD8D3] hover:text-accent">Download full JSON</button>
          <button onClick={onCopySummary} className="rounded-xl border border-line bg-white px-4 py-3 text-sm font-semibold text-muted transition hover:border-[#BFD8D3] hover:text-accent">Copy analysis summary</button>
        </div>
      </div>
      <div className="card overflow-hidden">
        <div className="border-b border-line p-5">
          <p className="label">Markdown preview</p>
          <h3 className="mt-2 text-lg font-semibold text-ink">Executive risk memo</h3>
        </div>
        <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap bg-slate-950 p-5 text-xs leading-6 text-slate-200">{result.report_markdown}</pre>
      </div>
    </div>
  )
}
