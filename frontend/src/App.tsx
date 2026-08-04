import { Routes, Route } from "react-router-dom"
import { Toaster } from "@/components/ui/sonner"
import ScaffoldCheckPage from "@/pages/ScaffoldCheckPage"

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<ScaffoldCheckPage />} />
      </Routes>
      <Toaster />
    </>
  )
}

export default App
