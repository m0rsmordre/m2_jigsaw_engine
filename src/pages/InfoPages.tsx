import { useLang } from '../hooks/useLang'

export function RulesPage() {
  const { d } = useLang()
  return (
    <article className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
      <h2 className="text-xl font-bold">{d.rulesTitle}</h2>
      <ul className="list-disc space-y-2 pl-5 text-sm text-slate-300">
        {d.rulesBody.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <p className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-sm text-amber-100">
        {d.disclaimer}
      </p>
    </article>
  )
}

export function HowToPage() {
  const { d } = useLang()
  return (
    <article className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
      <h2 className="text-xl font-bold">{d.howToTitle}</h2>
      <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-300">
        {d.howToBody.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ol>
      <p className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-sm text-amber-100">
        {d.disclaimer}
      </p>
    </article>
  )
}

export function AboutPage() {
  const { d } = useLang()
  return (
    <article className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
      <h2 className="text-xl font-bold">{d.aboutTitle}</h2>
      {d.aboutBody.map((line) => (
        <p key={line} className="text-sm leading-relaxed text-slate-300">
          {line}
        </p>
      ))}
      <p className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-sm text-amber-100">
        {d.disclaimer}
      </p>
    </article>
  )
}
