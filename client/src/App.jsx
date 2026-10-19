import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './store/auth'
import { connectSocket, disconnectSocket } from './lib/socket'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Features from './pages/Features'
import Pricing from './pages/Pricing'
import Changelog from './pages/Changelog'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Docs from './pages/Docs'
import About from './pages/About'
import Contact from './pages/Contact'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'
import NotFound from './pages/NotFound'
import Dashboard from './pages/Dashboard'
import Board from './pages/Board'
import Issues from './pages/Issues'
import Timeline from './pages/Timeline'
import Analytics from './pages/Analytics'
import Cycles from './pages/Cycles'
import Inbox from './pages/Inbox'
import Team from './pages/Team'
import Settings from './pages/Settings'
import Welcome from './pages/Welcome'
import Join from './pages/Join'

export default function App() {
  const { user } = useAuth()

  useEffect(() => {
    useAuth.getState().bootstrap()
  }, [])

  useEffect(() => {
    if (user) connectSocket()
    else disconnectSocket()
  }, [user])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/features" element={<Features />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/changelog" element={<Changelog />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/docs" element={<Docs />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />

        <Route path="/welcome" element={<Welcome />} />
        <Route path="/join/:token" element={<Join />} />

        <Route path="/app" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="board" element={<Board />} />
          <Route path="issues" element={<Issues />} />
          <Route path="timeline" element={<Timeline />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="cycles" element={<Cycles />} />
          <Route path="inbox" element={<Inbox />} />
          <Route path="team" element={<Team />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
