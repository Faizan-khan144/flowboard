import { Link } from 'react-router-dom'
import Logo from './Logo'

export default function SiteFooter() {
  return (
    <footer className="border-t border-line bg-white py-14">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 md:flex-row md:justify-between">
        <div className="max-w-xs">
          <Link to="/" className="inline-flex">
            <Logo size={30} wordClass="text-[16px]" />
          </Link>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            A fast, minimal issue tracker for small teams — boards, cycles, labels and realtime
            updates without the setup ceremony.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-12 text-sm sm:grid-cols-4">
          <div>
            <div className="mb-3 font-semibold">Product</div>
            <div className="flex flex-col gap-2.5 text-muted">
              <Link to="/features" className="transition-colors hover:text-accent">Features</Link>
              <Link to="/pricing" className="transition-colors hover:text-accent">Pricing</Link>
              <Link to="/changelog" className="transition-colors hover:text-accent">Changelog</Link>
              <Link to="/#faq" className="transition-colors hover:text-accent">FAQ</Link>
            </div>
          </div>
          <div>
            <div className="mb-3 font-semibold">Workspace</div>
            <div className="flex flex-col gap-2.5 text-muted">
              <Link to="/app/board" className="transition-colors hover:text-accent">Open board</Link>
              <Link to="/app/issues" className="transition-colors hover:text-accent">Issues</Link>
              <Link to="/app/inbox" className="transition-colors hover:text-accent">Inbox</Link>
              <Link to="/app/team" className="transition-colors hover:text-accent">Team</Link>
            </div>
          </div>
          <div>
            <div className="mb-3 font-semibold">Company</div>
            <div className="flex flex-col gap-2.5 text-muted">
              <Link to="/about" className="transition-colors hover:text-accent">About</Link>
              <Link to="/docs" className="transition-colors hover:text-accent">Docs</Link>
              <Link to="/contact" className="transition-colors hover:text-accent">Contact</Link>
            </div>
          </div>
          <div>
            <div className="mb-3 font-semibold">Account</div>
            <div className="flex flex-col gap-2.5 text-muted">
              <Link to="/login" className="transition-colors hover:text-accent">Log in</Link>
              <Link to="/signup" className="transition-colors hover:text-accent">Create account</Link>
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-12 flex max-w-6xl flex-col items-center justify-between gap-3 border-t border-line px-6 pt-6 text-xs text-faint sm:flex-row">
        <span>© {new Date().getFullYear()} Flowboard. Built for teams that ship.</span>
        <div className="flex items-center gap-4">
          <Link to="/terms" className="transition-colors hover:text-accent">Terms</Link>
          <Link to="/privacy" className="transition-colors hover:text-accent">Privacy</Link>
          <span className="hidden sm:inline">React · Express · Prisma · SQLite</span>
        </div>
      </div>
    </footer>
  )
}
