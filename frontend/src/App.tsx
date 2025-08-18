import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import "./App.css";
import Home from "./pages/Home";
import ImageView from "./pages/ImageView";
import Register from "./pages/Register";
import Login from "./pages/Login";
import { Navigate } from "react-router-dom";
import Upload from "./pages/Upload";
import Verification from "./pages/Verification";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />}></Route>
        <Route path="/register" element={<Register />}></Route>
        <Route path="/login" element={<Login />}></Route>

        <Route path="/verify" element={<Verification />}></Route>

        <Route path="/images/:imageId" element={<ImageView />}></Route>
        <Route path="/upload" element={<Upload />} />

        <Route path="*" element={<Navigate to="/register" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
