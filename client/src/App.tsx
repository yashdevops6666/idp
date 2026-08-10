import { Route, Routes } from "react-router-dom";
import { AuthGate } from "./components/AuthGate";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { Catalogue } from "./pages/Catalogue";
import { NewService } from "./pages/NewService";
import { NotFound } from "./pages/NotFound";

export default function App() {
  return (
    <AuthGate>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/catalogue" element={<Catalogue />} />
          <Route path="/new-service" element={<NewService />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </AuthGate>
  );
}
