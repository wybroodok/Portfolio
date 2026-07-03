import AboutInfo from '../components/AboutInfo'
import PageHeader from '../components/PageHeader'

export default function About() {
  return (
    <div className="page-enter flex flex-col min-h-[100dvh] pb-24">
      <PageHeader title="О нас" back="/" />
      <div className="flex-1 px-4 pt-4">
        <AboutInfo />
      </div>
    </div>
  )
}
