import {BrowserRouter as Router, Route, Routes} from 'react-router-dom'
import './App.css'
import Home from './pages/Home'
import ImageView from './pages/ImageView'
import Register from './pages/Register'
import Login from './pages/Login'
import { Navigate } from 'react-router-dom'

function App() {

  return (
    <Router>
      <Routes>
        <Route path="/" element={< Home />} ></Route>
        <Route path="/register" element={< Register />}></Route>
        <Route path="/login" element={< Login />}></Route>
        <Route path="/images/:imageId" element={< ImageView />} ></Route>

        {/* temporary */}
        <Route path="/upload" element={< Navigate to="/register" replace />} />
        
        <Route path="*" element={<Navigate to="/register" replace />} />
      </Routes>
    </Router>
  )
}

export default App
