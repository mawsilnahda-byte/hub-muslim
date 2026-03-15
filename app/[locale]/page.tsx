import { redirect } from 'next/navigation'

interface HomePageProps {
  params: Promise<{ locale: string }>
}

export default async function LocaleHomePage({ params }: HomePageProps) {
  const { locale } = await params
  redirect(`/${locale}/quran`)
}
