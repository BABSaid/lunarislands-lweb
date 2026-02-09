import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, UserCircle, LogOut, Settings, LayoutDashboard, ChevronDown } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { NotificationBell } from './NotificationBell';

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if user is logged in and refresh user data from server
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const localUser = JSON.parse(userStr);
      setUser(localUser);
      
      // Refresh user data from server to sync any changes
      const refreshUserData = async () => {
        try {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-dec47541/users/${encodeURIComponent(localUser.email)}`,
            {
              headers: {
                'Authorization': `Bearer ${publicAnonKey}`,
              },
            }
          );
          
          if (response.ok) {
            const data = await response.json();
            if (data.user) {
              // Update localStorage and state with fresh data
              localStorage.setItem('user', JSON.stringify(data.user));
              setUser(data.user);
              console.log('✅ User data refreshed from server');
            }
          }
        } catch (error) {
          console.error('Failed to refresh user data:', error);
        }
      };
      
      refreshUserData();
    }
  }, [location]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsDropdownOpen(false);
    navigate('/');
  };

  const handleDashboardClick = () => {
    if (user) {
      if (user.grade === 'staff') {
        navigate('/staff');
      } else if (user.entrepriseId) {
        // Redirect based on role
        if (user.role && ['patron', 'co-gerant'].includes(user.role)) {
          navigate('/manager');
        } else {
          // Regular employees go to home or a dedicated employee dashboard
          navigate('/');
        }
      }
      setIsDropdownOpen(false);
    }
  };

  const handleAccountSettings = () => {
    navigate('/account-settings');
    setIsDropdownOpen(false);
  };

  const canAccessDashboard = user && (user.grade === 'staff' || (user.entrepriseId && user.role && ['patron', 'co-gerant'].includes(user.role)));
  const canAccessGestion = user && user.role && ['patron', 'co-gerant'].includes(user.role);

  const navItems = [
    { path: '/', label: 'Accueil' },
    { path: '/entreprises', label: 'Entreprises' },
    { path: '/events', label: 'Événements' },
    { path: '/tickets', label: 'Support' },
    { path: '/reglement', label: 'Règlement' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-sm border-b border-amber-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <ImageWithFallback 
              src="https://i.imgur.com/Oo1ELPJ.png" 
              alt="LunarisLands Logo" 
              className="w-10 h-10 object-contain"
            />
            <span className="text-xl font-bold text-amber-500">LunarisLands</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`transition-colors ${
                  isActive(item.path)
                    ? 'text-amber-500'
                    : 'text-slate-300 hover:text-amber-400'
                }`}
              >
                {item.label}
              </Link>
            ))}
            
            {/* Notification Bell - Only show if user is logged in */}
            {user && <NotificationBell />}
            
            <a
              href="https://discord.gg/sa6PyYcMqh"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
            >
              Discord
            </a>
            
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <UserCircle className="w-4 h-4" />
                  {user.name}
                  <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-slate-800 rounded-lg shadow-xl border border-amber-900/30 overflow-hidden z-50">
                    {canAccessDashboard && (
                      <button
                        onClick={handleDashboardClick}
                        className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors flex items-center gap-2"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                      </button>
                    )}
                    {canAccessGestion && (
                      <button
                        onClick={() => {
                          navigate('/gestion');
                          setIsDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors flex items-center gap-2"
                      >
                        <Settings className="w-4 h-4" />
                        Gestion
                      </button>
                    )}
                    <button
                      onClick={handleAccountSettings}
                      className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors flex items-center gap-2 border-t border-slate-700"
                    >
                      <Settings className="w-4 h-4" />
                      Options du compte
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-600 hover:text-white transition-colors flex items-center gap-2 border-t border-slate-700"
                    >
                      <LogOut className="w-4 h-4" />
                      Se Déconnecter
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <UserCircle className="w-4 h-4" />
                Se connecter
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-slate-300 hover:text-amber-500 transition-colors"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-amber-900/30">
            <div className="flex flex-col gap-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`transition-colors ${
                    isActive(item.path)
                      ? 'text-amber-500'
                      : 'text-slate-300 hover:text-amber-400'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <a
                href="https://discord.gg/sa6PyYcMqh"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors text-center"
              >
                Discord
              </a>
              
              {user ? (
                <>
                  {canAccessDashboard && (
                    <button
                      onClick={() => {
                        handleDashboardClick();
                        setIsMenuOpen(false);
                      }}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors text-center flex items-center justify-center gap-2"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </button>
                  )}
                  {canAccessGestion && (
                    <button
                      onClick={() => {
                        navigate('/gestion');
                        setIsMenuOpen(false);
                      }}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors text-center flex items-center justify-center gap-2"
                    >
                      <Settings className="w-4 h-4" />
                      Gestion
                    </button>
                  )}
                  <button
                    onClick={() => {
                      handleAccountSettings();
                      setIsMenuOpen(false);
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors text-center flex items-center justify-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Options du compte
                  </button>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-center flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Se Déconnecter
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors text-center flex items-center justify-center gap-2"
                >
                  <UserCircle className="w-4 h-4" />
                  Se connecter
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}