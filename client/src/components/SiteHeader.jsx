import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { ArrowRight, Menu, X } from 'lucide-react'
import Logo from './Logo'
import { useAuth } from '../store/auth'

const LINKS = [
  ['Features', '/features'],
  ['Pricing', '/pricing'],
  ['Changelog', '/changelog'],
  ['Docs', '/docs'],
  ['About', '/about'],
]

export default function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const user = useAuth((s) => s.user)
  const isGuest = useAuth((s) => s.isGuest)
  const signedIn = Boolean(user) && !isGuest

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setOpen(false)
    window.scrollTo({ top: 0 })
  }, [pathname])

  return (
    <header className="sticky top-0 z-40 px-4 pt-4">
      <div className="mx-auto max-w-6xl">
        <div className={`nav-pill relative flex h-14 items-center justify-between overflow-hidden rounded-2xl border border-line/70 bg-white/70 px-4 ring-1 ring-white/60 backdrop-blur-xl ${scrolled ? 'scrolled' : ''}`}>
          <span className="nav-hairline" />
          <Link to="/" className="group relative z-10 flex items-center">
            <span className="transition-transform duration-500 group-hover:rotate-[8deg] group-hover:scale-110">
              <Logo size={28} wordClass="text-[15px]" />
            </span>
          </Link>

          <nav className="relative z-10 hidden items-center gap-7 text-[13.5px] font-medium text-muted lg:flex">
            {LINKS.map(([label, to]) =>
              to.startsWith('/#') ? (
                <a key={label} href={to} className="nav-link transition-colors hover:text-fg">
                  {label}
                </a>
              ) : (
                <NavLink
                  key={label}
                  to={to}
                  className={({ isActive }) => `nav-link transition-colors ${isActive ? 'on font-semibold text-fg' : 'hover:text-fg'}`}
                >
                  {label}
                </NavLink>
              ),
            )}
          </nav>

          <div className="relative z-10 flex items-center gap-2">
            {signedIn ? (
              <Link
                to="/app/board"
                className="btn-shine hidden items-center gap-1.5 rounded-xl bg-gradient-to-r from-accent to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-accent/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-accent/35 sm:flex"
              >
                Open app <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden rounded-xl px-3.5 py-2 text-sm font-medium text-muted transition-colors hover:bg-raised hover:text-fg sm:block"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="btn-shine hidden items-center gap-1.5 rounded-xl bg-gradient-to-r from-accent to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-accent/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-accent/35 sm:flex"
                >
                  Get started <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            )}
            <button
              onClick={() => setOpen((v) => !v)}
              aria-label="Menu"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-white transition-colors hover:bg-raised lg:hidden"
            >
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {open && (
          <div className="nav-menu mt-2 flex flex-col gap-1 rounded-2xl border border-line bg-white/95 p-3 shadow-2xl backdrop-blur-xl lg:hidden">
            {LINKS.map(([label, to]) =>
              to.startsWith('/#') ? (
                <a key={label} href={to} className="rounded-xl px-3 py-2.5 text-sm font-medium text-muted hover:bg-accent/10 hover:text-accent">
                  {label}
                </a>
              ) : (
                <Link key={label} to={to} className="rounded-xl px-3 py-2.5 text-sm font-medium text-muted hover:bg-accent/10 hover:text-accent">
                  {label}
                </Link>
              ),
            )}
            {signedIn ? (
              <Link to="/app/board" className="mt-1 flex items-center justify-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white">
                Open app <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link to="/login" className="rounded-xl px-3 py-2.5 text-sm font-medium text-muted hover:bg-accent/10 hover:text-accent">
                  Log in
                </Link>
                <Link to="/signup" className="mt-1 flex items-center justify-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white">
                  Get started <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
