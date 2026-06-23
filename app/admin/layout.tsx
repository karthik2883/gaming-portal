import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminSessionProvider from '@/components/admin/AdminSessionProvider';
import styles from './admin.module.css';

export const metadata: Metadata = {
  title: 'Admin Panel — FlipTrip Games',
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const headersList = headers();
  const pathname = headersList.get('x-pathname') || '';

  // If rendering the login page, bypass layout shell and redirect logic
  if (pathname === '/admin/login') {
    return (
      <AdminSessionProvider session={null}>
        {children}
      </AdminSessionProvider>
    );
  }

  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/admin/login');
  }

  return (
    <AdminSessionProvider session={session}>
      <div className={styles.adminLayout}>
        <AdminSidebar />
        <main className={styles.adminMain}>
          <div className={styles.adminContent}>
            {children}
          </div>
        </main>
      </div>
    </AdminSessionProvider>
  );
}
