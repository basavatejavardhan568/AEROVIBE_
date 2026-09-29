import Navigation from './components/Navigation'
import Hero from './components/Hero'
import Concept from './components/Concept'
import TurbineLab from './components/TurbineLab'
import LiveDemo from './components/LiveDemo'
import DataSection from './components/DataSection'
import ScaleHighway from './components/ScaleHighway'
import Science from './components/Science'
import Prototype from './components/Prototype'
import Footer from './components/Footer'

export default function App() {
  return (
    <div className="min-h-screen bg-void text-ink antialiased">
      <a
        href="#demo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded focus:bg-accent focus:px-4 focus:py-2 focus:text-void"
      >
        Skip to demo
      </a>
      <Navigation />
      <main>
        <Hero />
        <Concept />
        <TurbineLab />
        <LiveDemo />
        <DataSection />
        <ScaleHighway />
        <Science />
        <Prototype />
      </main>
      <Footer />
    </div>
  )
}
