import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { FaAtom, FaLaptopCode, FaSatelliteDish, FaGlobe, FaPuzzlePiece, FaSignInAlt, FaSignOutAlt, FaUserCircle } from 'react-icons/fa';

export const QxLabsNavbar: React.FC = () => {
  const location = useLocation();
  const { currentUser, logout } = useAuth();

  const navLinks = [
    {
      name: 'Quantum Playground',
      path: '/playground',
      icon: FaLaptopCode,
      badge: 'Circuits',
    },
    {
      name: 'QRoute',
      path: '/qroute',
      icon: FaSatelliteDish,
      badge: 'Hardware',
    },
    {
      name: 'Bloch Sphere (Tasks)',
      path: '/bloch',
      icon: FaGlobe,
      badge: '3D & Tasks',
    },
    {
      name: 'Gate Puzzles',
      path: '/puzzles',
      icon: FaPuzzlePiece,
      badge: 'Challenges',
    },
  ];

  return (
    <nav className="w-full bg-white/80 backdrop-blur-md border-b border-zinc-200/80 sticky top-0 z-50 transition-colors">
      <div className="w-full px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-8 h-8 rounded-lg bg-zinc-950 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform duration-200">
            <FaAtom className="text-white text-base" />
          </div>
          <div className="flex items-center">
            <span className="text-base font-semibold tracking-tight text-zinc-950">
              QxLabs
            </span>
          </div>
        </Link>

        {/* Core Links - only visible after login */}
        {currentUser && (
          <div className="hidden md:flex items-center gap-1 bg-zinc-100/80 p-1 rounded-full border border-zinc-200/60">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname.startsWith(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-white text-zinc-950 shadow-sm font-semibold'
                      : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/50'
                  }`}
                >
                  <Icon className={`text-xs ${isActive ? 'text-zinc-950' : 'text-zinc-500'}`} />
                  <span>{link.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-200/70 text-zinc-700 font-mono">
                    {link.badge}
                  </span>
                </Link>
              );
            })}
          </div>
        )}

        {/* Before login: Tagline badge pill */}
        {!currentUser && (
          <div className="hidden sm:flex items-center px-4 py-1.5 rounded-full bg-zinc-100/90 border border-zinc-200/80 text-xs font-medium text-zinc-600 shadow-sm select-none">
            <span>Circuits • Hardware • 3D Tasks • Puzzles</span>
          </div>
        )}

        {/* Right side Auth */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 border border-zinc-200/80 text-xs text-zinc-800 font-medium">
                <FaUserCircle className="text-zinc-600 text-sm" />
                <span className="max-w-[130px] truncate">
                  {currentUser.displayName || currentUser.email}
                </span>
              </div>
              <button
                onClick={logout}
                title="Sign out"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-600 hover:text-zinc-950 text-xs transition-colors"
              >
                <FaSignOutAlt className="text-xs" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium tracking-tight shadow-sm transition-colors active:scale-95"
            >
              <FaSignInAlt className="text-xs" />
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile nav row */}
      {currentUser ? (
        <div className="md:hidden flex items-center justify-around border-t border-zinc-200 px-2 py-2 bg-white">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname.startsWith(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex flex-col items-center gap-1 px-3 py-1 rounded text-[11px] ${
                  isActive ? 'text-zinc-950 font-semibold' : 'text-zinc-500'
                }`}
              >
                <Icon className="text-sm" />
                <span>{link.badge}</span>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="md:hidden flex items-center justify-center py-2 px-4 border-t border-zinc-200 bg-zinc-50 text-[11px] text-zinc-600 font-medium">
          <span>Circuits • Hardware • 3D Tasks • Puzzles</span>
        </div>
      )}
    </nav>
  );
};
