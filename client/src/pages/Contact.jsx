import { useState } from 'react'
import { Mail, MessageSquare, LifeBuoy, Check, ArrowRight } from 'lucide-react'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import Reveal from '../components/Reveal'
import SplitHeading from '../components/SplitHeading'

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [sent, setSent] = useState(false)

  return (
    <div className="min-h-full bg-white">
      <SiteHeader />

      <section className="relative overflow-hidden">
        <div className="hero-grid pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-3xl px-6 pt-24 text-center">
          <Reveal className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-white/80 px-3.5 py-1.5 text-[13px] text-muted shadow-sm">
            <Mail className="h-3.5 w-3.5 text-accent" /> Contact
          </Reveal>
          <SplitHeading text="Talk to a human." className="text-4xl font-bold tracking-tight md:text-6xl" />
          <Reveal delay={120}>
            <p className="mx-auto mt-6 max-w-xl text-lg text-muted">
              Questions, bug reports, or a workspace to migrate? Write to us — replies usually land
              the same day.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="pb-28 pt-14">
        <div className="mx-auto grid max-w-5xl gap-8 px-6 lg:grid-cols-[1fr,300px]">
          <Reveal variant="left">
            <div className="rounded-3xl border border-line bg-white p-7 shadow-sm">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  setSent(true)
                }}
                className="flex flex-col gap-4"
              >
                {[
                  ['name', 'Your name', 'Faizan Khan'],
                  ['email', 'Email', 'you@example.com'],
                ].map(([key, label, ph]) => (
                  <label key={key} className="block">
                    <span className="mb-1.5 block text-[13px] font-medium text-muted">{label}</span>
                    <input
                      required
                      type={key === 'email' ? 'email' : 'text'}
                      value={form[key]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      placeholder={ph}
                      className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-[15px] outline-none transition-all focus:border-accent focus:ring-4 focus:ring-accent/10"
                    />
                  </label>
                ))}
                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-medium text-muted">Message</span>
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Tell us what you are working on…"
                    className="w-full resize-none rounded-xl border border-line bg-white px-3.5 py-2.5 text-[15px] outline-none transition-all focus:border-accent focus:ring-4 focus:ring-accent/10"
                  />
                </label>
                <button
                  type="submit"
                  className="btn-shine mt-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent to-violet-600 px-5 py-3 font-medium text-white shadow-lg shadow-accent/25 transition-all hover:-translate-y-0.5"
                >
                  {sent ? 'Message sent' : 'Send message'} <ArrowRight className="h-4 w-4" />
                </button>
              </form>
              {sent && (
                <p className="mt-4 flex items-center gap-2 rounded-xl border border-ok/30 bg-ok/5 px-4 py-3 text-[13.5px] text-ok animate-pop-in">
                  <Check className="h-4 w-4" /> Thanks — we will get back to you shortly.
                </p>
              )}
            </div>
          </Reveal>

          <Reveal variant="right" delay={120} className="flex flex-col gap-4">
            {[
              { icon: Mail, title: 'Email', text: 'hello@flowboard.dev', sub: 'General & billing' },
              { icon: LifeBuoy, title: 'Support', text: 'support@flowboard.dev', sub: 'Bug reports & help' },
              { icon: MessageSquare, title: 'Community', text: 'Discussions & ideas', sub: 'Weekly product threads' },
            ].map(({ icon: Icon, title, text, sub }, i) => (
              <div key={title} className="lift-glow rounded-2xl border border-line bg-bg p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="mt-3 text-[15px] font-semibold">{title}</div>
                <div className="mt-1 text-[14px] text-accent">{text}</div>
                <div className="mt-1 text-[12.5px] text-faint">{sub}</div>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
