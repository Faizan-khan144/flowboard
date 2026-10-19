import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'
import { useUI } from '../store/ui'

const TONES = {
  success: { icon: CheckCircle2, cls: 'text-emerald-600', bar: 'bg-emerald-500' },
  error: { icon: AlertTriangle, cls: 'text-red-600', bar: 'bg-red-500' },
  default: { icon: Info, cls: 'text-accent', bar: 'bg-accent' },
}

export default function Toasts() {
  const toasts = useUI((s) => s.toasts)
  const dismiss = useUI((s) => s.dismissToast)

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[80] flex w-[330px] flex-col gap-2.5">
      {toasts.map((t) => {
        const tone = TONES[t.tone] || TONES.default
        const Icon = tone.icon
        return (
          <div
            key={t.id}
            className="toast-in pointer-events-auto relative overflow-hidden rounded-xl border border-line bg-white p-3.5 pr-9 shadow-2xl shadow-slate-900/10"
          >
            <span className={`absolute inset-y-0 left-0 w-1 ${tone.bar}`} />
            <div className="flex items-start gap-2.5">
              <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${tone.cls}`} />
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] leading-snug text-fg">{t.message}</p>
                {t.action && (
                  <button
                    onClick={() => {
                      t.action.onClick()
                      dismiss(t.id)
                    }}
                    className="mt-1 text-[12.5px] font-medium text-accent hover:underline"
                  >
                    {t.action.label}
                  </button>
                )}
              </div>
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="absolute right-2 top-2 rounded-md p-1 text-faint transition-colors hover:bg-raised hover:text-fg"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
