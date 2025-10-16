import { Link, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { LogOut } from 'lucide-react';
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarTrigger } from '@/components/ui/Menubar';
import { Button } from './ui/Button';

export default function Header() {
  const { userData } = useContext(AuthContext);
  const navigate = useNavigate();

  const initial = (userData?.email?.[0] || 'U').toUpperCase();

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="flex items-center px-4 sm:px-6 lg:px-8 py-3">
        <div className="w-48 flex items-center">
          <Link
            to={'/'}
            className="flex items-center gap-3 group"
          >
            <div className="h-8 w-8 bg-foreground rounded-md flex items-center justify-center transition-transform group-hover:scale-105">
              <span className="text-background font-bold text-sm">SM</span>
            </div>
            <span className="text-lg font-semibold text-foreground tracking-tight whitespace-nowrap">
              10x Series Matcher
            </span>
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-end">
          {userData ? (
            <div className="min-w-[120px] flex justify-end">
              <Menubar className="rounded-none space-x-0 border-none data-[state=open]:!bg-none">
                <MenubarMenu>
                  <MenubarTrigger
                    omitOpenBg
                    className="h-9 w-9 rounded-full overflow-hidden bg-secondary ring-1 ring-border hover:ring-foreground transition-all p-0 cursor-pointer"
                  >
                    <span className="h-full w-full flex items-center justify-center text-xs font-semibold text-foreground">
                      {initial}
                    </span>
                  </MenubarTrigger>
                  <MenubarContent>
                    <MenubarItem
                      onClick={() => {
                        navigate('/logout');
                      }}
                      className="pt-2 hover:text-foreground cursor-pointer flex items-center gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      Log out
                    </MenubarItem>
                  </MenubarContent>
                </MenubarMenu>
              </Menubar>
            </div>
          ) : (
            <div className="min-w-[120px] flex items-center gap-3 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/login')}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Login
              </Button>
              <Button
                size="sm"
                onClick={() => navigate('/login?tab=register')}
                className="text-sm font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors"
              >
                Sign Up
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
