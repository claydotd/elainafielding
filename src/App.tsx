import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { About } from './pages/About'
import { AdminHomepage } from './pages/admin/AdminHomepage'
import { AdminLogin } from './pages/admin/AdminLogin'
import { AdminWorks } from './pages/admin/AdminWorks'
import { WorkEditor } from './pages/admin/WorkEditor'
import { Home } from './pages/Home'
import { Work } from './pages/Work'
import { WorkDetail } from './pages/WorkDetail'
import { Shop } from './pages/Shop'
import './App.css'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="work" element={<Work />} />
        <Route path="work/:slug" element={<WorkDetail />} />
        <Route path="about" element={<About />} />
        <Route path="shop" element={<Shop />} />
        <Route path="admin/login" element={<AdminLogin />} />
        <Route path="admin" element={<AdminWorks />} />
        <Route path="admin/homepage" element={<AdminHomepage />} />
        <Route path="admin/works/new" element={<WorkEditor />} />
        <Route path="admin/works/:slug" element={<WorkEditor />} />
      </Route>
    </Routes>
  )
}
