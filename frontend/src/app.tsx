import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import PipelineApp from "./PipelineApp";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/pipeline" element={<PipelineApp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
