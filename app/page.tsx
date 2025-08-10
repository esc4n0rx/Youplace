import HeaderBar from "@/components/header-bar"
import MapCanvas from "@/components/map-canvas"

export default function Page() {
  return (
    <main className="relative min-h-screen bg-white">
      <HeaderBar />
      <section className="pt-16 h-[calc(100vh-64px)]">
        <MapCanvas />
      </section>
    </main>
  )
}
