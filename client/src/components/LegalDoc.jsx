import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import Reveal from '../components/Reveal'
import SplitHeading from '../components/SplitHeading'

export default function LegalDoc({ title, intro, updated, sections }) {
  return (
    <div className="min-h-full bg-white">
      <SiteHeader />

      <section className="border-b border-line">
        <div className="mx-auto max-w-3xl px-6 pb-14 pt-24">
          <SplitHeading text={title} className="text-4xl font-bold tracking-tight md:text-5xl" />
          <Reveal delay={100}>
            <p className="mt-5 text-lg leading-relaxed text-muted">{intro}</p>
            <p className="mt-4 text-[13px] uppercase tracking-wide text-faint">Last updated {updated}</p>
          </Reveal>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto flex max-w-3xl flex-col gap-10 px-6">
          {sections.map(([h, ...paras], i) => (
            <Reveal key={h} delay={i * 70}>
              <h2 className="text-xl font-bold tracking-tight">{h}</h2>
              <div className="mt-3 flex flex-col gap-3">
                {paras.map((p) => (
                  <p key={p} className="text-[15px] leading-relaxed text-muted">
                    {p}
                  </p>
                ))}
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
