import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { User, LogOut, Heart, Users, Menu, X } from 'lucide-react';
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarTrigger } from '@/components/ui/Menubar';
import { Button } from './ui/Button';
import { Skeleton } from './ui/Skeleton';

const sections = [
  { name: 'Home', href: '/', authHref: '/dashboard' },
  { name: 'Series', href: '/series', requiresAuth: true },
  { name: 'Watch Rooms', href: '/watchrooms', requiresAuth: true },
];

export default function Header() {
  const { userData, userDataInitialized } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const initial = (userData?.email?.[0] || 'U').toUpperCase();

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border shadow-sm backdrop-blur-sm">
      <div className="relative flex items-center justify-between gap-2 px-3 sm:px-4 lg:px-8 py-3">
        {/* Logo */}
        <div className="flex-shrink-0 flex items-center">
          <Link
            to={userData ? '/dashboard' : '/'}
            className="flex items-center gap-2"
          >
            <div className="h-8 w-8 bg-foreground rounded-md flex items-center justify-center transition-transform group-hover:scale-105">
              <span className="text-background font-bold text-sm">SM</span>
            </div>
            <h2 className="text-lg font-semibold tracking-tight">10x Series Matcher</h2>
          </Link>
        </div>

        {/* Desktop Navigation - Centered */}
        <nav className="hidden md:flex absolute left-1/2 transform -translate-x-1/2">
          <div className="flex items-center space-x-6 lg:space-x-8">
            {sections
              .filter((section) => !section.requiresAuth || userData)
              .map((item) => {
                const href = userData && item.authHref ? item.authHref : item.href;
                let isActive = location.pathname === '/' && location.pathname === href;

                if (href !== '/') {
                  isActive = location.pathname.startsWith(href);
                }
                return (
                  <button
                    key={item.href}
                    onClick={() => navigate(href)}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'relative px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap',
                      'text-muted-foreground hover:text-primary cursor-pointer',
                      isActive && 'text-primary',
                    )}
                  >
                    {item.name}
                    {isActive && <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary" />}
                  </button>
                );
              })}
          </div>
        </nav>

        {/* Desktop Auth Section */}
        <div className="hidden md:flex flex-shrink-0 items-center ml-auto">
          {!userDataInitialized ? (
            <div className="flex items-center gap-2 lg:gap-3">
              {/* Gentle avatar placeholder while auth initializes */}
              <Skeleton className="h-10 w-10 rounded-full bg-muted" />
            </div>
          ) : userData ? (
            <div className="flex items-center justify-end">
              <Menubar className="rounded-none space-x-0 border-none data-[state=open]:!bg-none">
                <MenubarMenu>
                  <MenubarTrigger
                    omitOpenBg
                    className="h-10 w-10 rounded-full overflow-hidden bg-muted border-2 border-border hover:border-primary transition-all duration-200 p-0 cursor-pointer shadow-sm hover:shadow-md"
                  >
                    <span className="h-full w-full flex items-center justify-center text-sm font-semibold text-foreground">
                      {initial}
                    </span>
                  </MenubarTrigger>
                  <MenubarContent>
                    <MenubarItem
                      onClick={() => {
                        navigate('/series');
                      }}
                      className="pt-2 hover:text-primary cursor-pointer flex items-center gap-2"
                    >
                      <Heart className="h-4 w-4" />
                      My Series
                    </MenubarItem>
                    <MenubarItem
                      onClick={() => {
                        navigate('/watchrooms');
                      }}
                      className="hover:text-primary cursor-pointer flex items-center gap-2"
                    >
                      <Users className="h-4 w-4" />
                      My Watch Rooms
                    </MenubarItem>
                    <MenubarItem
                      onClick={() => {
                        navigate('/my-profile');
                      }}
                      className="hover:text-primary cursor-pointer flex items-center gap-2"
                    >
                      <User className="h-4 w-4" />
                      My Profile
                    </MenubarItem>
                    <MenubarItem
                      onClick={() => {
                        navigate('/logout');
                      }}
                      className="pt-2 hover:text-primary cursor-pointer flex items-center gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      Log out
                    </MenubarItem>
                  </MenubarContent>
                </MenubarMenu>
              </Menubar>
            </div>
          ) : (
            <div className="flex items-center gap-2 lg:gap-3">
              <Button
                variant="link"
                size="lg"
                onClick={() => navigate('/login')}
                className="text-sm text-muted-foreground whitespace-nowrap h-10 px-3"
              >
                Sign in
              </Button>
              <Button
                size="lg"
                onClick={() => navigate('/login?tab=register')}
                className="text-sm bg-primary hover:bg-primary/90 transition-all duration-300 font-semibold text-primary-foreground rounded-md whitespace-nowrap h-10 px-3"
              >
                Sign Up
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-2">
          {!userDataInitialized ? (
            <Skeleton className="h-8 w-8 rounded-full bg-muted" />
          ) : userData ? (
            <div className="flex items-center gap-2">
              <Menubar className="rounded-none space-x-0 border-none data-[state=open]:!bg-none">
                <MenubarMenu>
                  <MenubarTrigger
                    omitOpenBg
                    className="h-8 w-8 rounded-full overflow-hidden bg-muted border-2 border-border hover:border-primary transition-all duration-200 p-0 cursor-pointer shadow-sm hover:shadow-md"
                  >
                    <span className="h-full w-full flex items-center justify-center text-xs font-semibold text-foreground">
                      {initial}
                    </span>
                  </MenubarTrigger>
                  <MenubarContent>
                    <MenubarItem
                      onClick={() => {
                        navigate('/series');
                      }}
                      className="pt-2 hover:text-primary cursor-pointer flex items-center gap-2"
                    >
                      <Heart className="h-4 w-4" />
                      My Series
                    </MenubarItem>
                    <MenubarItem
                      onClick={() => {
                        navigate('/watchrooms');
                      }}
                      className="hover:text-primary cursor-pointer flex items-center gap-2"
                    >
                      <Users className="h-4 w-4" />
                      My Watch Rooms
                    </MenubarItem>
                    <MenubarItem
                      onClick={() => {
                        navigate('/my-profile');
                      }}
                      className="hover:text-primary cursor-pointer flex items-center gap-2"
                    >
                      <User className="h-4 w-4" />
                      My Profile
                    </MenubarItem>
                    <MenubarItem
                      onClick={() => {
                        navigate('/logout');
                      }}
                      className="pt-2 hover:text-primary cursor-pointer flex items-center gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      Log out
                    </MenubarItem>
                  </MenubarContent>
                </MenubarMenu>
              </Menubar>
            </div>
          ) : (
            <Button
              size="sm"
              onClick={() => navigate('/login')}
              className="text-xs bg-primary hover:bg-primary/90 text-primary-foreground h-8 px-3"
            >
              Login
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="h-8 w-8 p-0"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="px-3 py-2 space-y-1">
            {sections
              .filter((section) => !section.requiresAuth || userData)
              .map((item) => {
                const href = userData && item.authHref ? item.authHref : item.href;
                const isActive = location.pathname === href;
                return (
                  <button
                    key={item.href}
                    onClick={() => {
                      navigate(href);
                      setMobileMenuOpen(false);
                    }}
                    className={cn(
                      'block w-full text-left px-3 py-2 text-sm font-medium rounded-md transition-colors',
                      'text-muted-foreground hover:text-primary hover:bg-primary/10',
                      isActive && 'text-primary bg-primary/10',
                    )}
                  >
                    {item.name}
                  </button>
                );
              })}

            {userDataInitialized && !userData && (
              <div className="pt-2 border-t border-border">
                <button
                  onClick={() => {
                    navigate('/login');
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-sm font-medium rounded-md transition-colors text-muted-foreground hover:text-primary hover:bg-primary/10"
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    navigate('/login?tab=register');
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-sm font-medium rounded-md transition-colors text-muted-foreground hover:text-primary hover:bg-primary/10"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
