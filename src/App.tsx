import './index.css'
import './App.css'
import './styles/ChatSidebar.css'
import './styles/DualFrameworkSlide.css'
import { SlideDeck } from './components/SlideDeck'
import { buildSlides } from './services/slideBuilder'

const slidesContent = buildSlides()

export default function App() {
  return <SlideDeck slides={slidesContent} />
}
