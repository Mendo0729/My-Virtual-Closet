import { Outlet } from 'react-router'
import BottomNavigation from './BottomNavigation'

export default function AppLayout() {
  return (
    <div className="min-h-dvh bg-[#eeeaf4]">
      <div className="mx-auto min-h-dvh w-full max-w-md bg-[#fcfbfd] shadow-sm">
        <main className="pb-24">
          <Outlet />
        </main>

        <BottomNavigation />
      </div>
    </div>
  )
}
