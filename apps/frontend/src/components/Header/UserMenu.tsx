import { useNavigate } from 'react-router-dom';
import { User, LogOut, Heart, Users } from 'lucide-react';
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarTrigger } from '@/components/ui/Menubar';

interface UserMenuProps {
  initial: string;
  size?: 'small' | 'large';
}

export function UserMenu({ initial, size = 'large' }: UserMenuProps) {
  const navigate = useNavigate();
  const sizeClasses = size === 'small' ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm';

  return (
    <Menubar className="rounded-none space-x-0 border-none data-[state=open]:!bg-none">
      <MenubarMenu>
        <MenubarTrigger
          omitOpenBg
          className={`${sizeClasses} rounded-full overflow-hidden bg-muted border-2 border-border hover:border-primary transition-all duration-200 p-0 cursor-pointer shadow-sm hover:shadow-md`}
        >
          <span className="h-full w-full flex items-center justify-center font-semibold text-foreground">
            {initial}
          </span>
        </MenubarTrigger>
        <MenubarContent>
          <MenubarItem
            onClick={() => navigate('/series')}
            className="pt-2 hover:text-primary cursor-pointer flex items-center gap-2"
          >
            <Heart className="h-4 w-4" />
            My Series
          </MenubarItem>
          <MenubarItem
            onClick={() => navigate('/watchrooms')}
            className="hover:text-primary cursor-pointer flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            My Watch Rooms
          </MenubarItem>
          <MenubarItem
            onClick={() => navigate('/my-profile')}
            className="hover:text-primary cursor-pointer flex items-center gap-2"
          >
            <User className="h-4 w-4" />
            My Profile
          </MenubarItem>
          <MenubarItem
            onClick={() => navigate('/logout')}
            className="pt-2 hover:text-primary cursor-pointer flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}
