// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import raluJpg from './assets/ralu.jpg'
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom'
import './App.css'
import Home from './pages/Home'
import ImageView from './pages/ImageView'
import Register from './pages/Register'
import Login from './pages/Login'
import { Navigate } from 'react-router-dom'

function App() {
  // const [count, setCount] = useState(0)

  return (
    <Router>
      <Routes>
        <Route path="/" element={< Home />} ></Route>
        <Route path="/images/:imageId" element={< ImageView />} ></Route>
        <Route path="/ralu" element={
          <div>
            <h1>Te iubesccccccccc raluuuuuuuuuuuuu</h1>
            <img src={raluJpg} style={{ width: '300px', height: 'auto' }} />
          </div>
        } ></Route>
        <Route path="/register" element={< Register />}></Route>
        <Route path="/login" element={< Login />}></Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>


    // <>
    //   <div>
    //     <a href="https://vite.dev" target="_blank">
    //       <img src={viteLogo} className="logo" alt="Vite logo" />
    //     </a>
    //     <a href="https://react.dev" target="_blank">
    //       <img src={reactLogo} className="logo react" alt="React logo" />
    //     </a>
    //   </div>
    //   <h1>Vite + React</h1>
    //   <div className="card">
    //     <button onClick={() => setCount((count) => count + 1)}>
    //       count is {count}
    //     </button>
    //     <p>
    //       Edit <code>src/App.tsx</code> and save to test HMR
    //     </p>
    //   </div>
    //   <p className="read-the-docs">
    //     Click on the Vite and React logos to learn more
    //   </p>
    // </>
  )
}

export default App
