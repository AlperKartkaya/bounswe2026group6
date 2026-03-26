import { Link, NavLink, Outlet } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'

export function Shell() {
  const { accessToken, currentUser, logoutUser } = useAuth()

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/">
          <span className="brand-mark">NEPH</span>
          <span className="brand-copy">Neighborhood Emergency Preparedness Hub</span>
        </Link>

        <nav className="nav-links">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/emergency-numbers">Emergency numbers</NavLink>
          <NavLink to="/news">News</NavLink>
          {accessToken ? <NavLink to="/profile">Profile</NavLink> : null}
          {currentUser?.isAdmin ? <NavLink to="/admin">Admin</NavLink> : null}
          {!accessToken ? <NavLink to="/login">Log in</NavLink> : null}
          {!accessToken ? <NavLink to="/signup">Sign up</NavLink> : null}
          {accessToken ? (
            <button className="ghost-button" onClick={logoutUser} type="button">
              Log out
            </button>
          ) : null}
        </nav>
      </header>

      <main className="page-shell">
        {accessToken && currentUser ? (
          <div className="session-banner">Signed in as {currentUser.email}</div>
        ) : null}
        <Outlet />
      </main>
    </div>
  )
}
