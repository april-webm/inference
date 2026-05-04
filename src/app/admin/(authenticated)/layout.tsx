import { verifyAdminSession } from '@/lib/admin-session'
import { redirect } from 'next/navigation'
import { AdminNav } from '../AdminNav'

export default async function AdminAuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const isAdmin = await verifyAdminSession()
  if (!isAdmin) redirect('/admin/login')

  return (
    <div className="min-h-screen flex">
      <AdminNav />
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  )
}
