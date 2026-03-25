import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home         from "./pages/Home";
import MarketDetail from "./pages/MarketDetail";
import CreateMarket from "./pages/CreateMarket";
import Profile      from "./pages/Profile";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                 element={<Home />} />
        <Route path="/market/:id"       element={<MarketDetail />} />
        <Route path="/create"           element={<CreateMarket />} />
        <Route path="/profile"          element={<Profile />} />
      </Routes>
    </BrowserRouter>
  );
}
