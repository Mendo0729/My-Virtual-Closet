import { Outlet } from 'react-router'
import BottomNavigation from './BottomNavigation'

export default function AppLayout() {
  return (
    <div className="min-h-dvh bg-[#f2eef8] text-zinc-950 transition-colors dark:bg-[#050a14] dark:text-zinc-50">
      <div className="mx-auto min-h-dvh w-full max-w-md border-x border-black/[0.04] bg-[#fffefe] shadow-[0_20px_70px_rgba(42,27,78,0.08)] transition-colors dark:border-white/[0.06] dark:bg-[#07101d] dark:shadow-[0_20px_70px_rgba(0,0,0,0.45)]">
        <main className="pb-24">
          <Outlet />
        </main>

        <BottomNavigation />
      </div>
    </div>
  )
}
