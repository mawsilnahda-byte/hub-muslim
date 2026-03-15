import { MainLayout } from '@/components/layout/main-layout'

interface MainGroupLayoutProps {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function MainGroupLayout({ children, params }: MainGroupLayoutProps) {
  const { locale } = await params
  return <MainLayout locale={locale}>{children}</MainLayout>
}
