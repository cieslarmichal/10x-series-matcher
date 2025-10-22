import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { StrictMode } from 'react';
import { AuthContextProvider } from './context/AuthContextProvider.tsx';

import Root from './pages/Root';
import { CookiesProvider } from 'react-cookie';
import HomePage from './pages/HomePage.tsx';
import { TooltipProvider } from './components/ui/Tooltip.tsx';
import PrivateRoute from './auth/privateRoute.tsx';
import LogoutPage from './pages/LogoutPage.tsx';
import LoginPage from './pages/LoginPage.tsx';
import SeriesPage from './pages/Series.tsx';
import WatchRoomsPage from './pages/WatchRooms.tsx';
import AboutPage from './pages/About.tsx';
import ProfilePage from './pages/Profile.tsx';
import JoinRoomPage from './pages/JoinRoomPage.tsx';
import RoomPage from './pages/RoomPage.tsx';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: '/logout',
        element: (
          <PrivateRoute>
            <LogoutPage />
          </PrivateRoute>
        ),
      },
      {
        path: '/series',
        element: (
          <PrivateRoute>
            <SeriesPage />
          </PrivateRoute>
        ),
      },
      {
        path: '/watchrooms',
        element: (
          <PrivateRoute>
            <WatchRoomsPage />
          </PrivateRoute>
        ),
      },
      {
        path: '/watchrooms/:watchroomId',
        element: (
          <PrivateRoute>
            <RoomPage />
          </PrivateRoute>
        ),
      },
      {
        path: '/room/:publicLinkId',
        element: <JoinRoomPage />,
      },
      {
        path: '/about',
        element: <AboutPage />,
      },
      {
        path: '/my-profile',
        element: (
          <PrivateRoute>
            <ProfilePage />
          </PrivateRoute>
        ),
      },
    ],
  },
]);

function App() {
  return (
    <StrictMode>
      <CookiesProvider>
        <AuthContextProvider>
          <TooltipProvider>
            <RouterProvider router={router} />
          </TooltipProvider>
        </AuthContextProvider>
      </CookiesProvider>
    </StrictMode>
  );
}

export default App;
