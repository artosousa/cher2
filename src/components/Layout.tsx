
import React, { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { CalendarDays, List, ListCheck, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { auth } from "../lib/firebase";
import UserProfile from "./UserProfile";
import { useAuthState } from "react-firebase-hooks/auth";

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, loading] = useAuthState(auth);

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link to="/" className="text-xl font-bold">
            Todo Streaks
          </Link>
          <UserProfile user={user} />
        </div>
      </header>

      {user && (
        <nav className="bg-white border-b">
          <div className="container mx-auto px-4 py-2">
            <div className="flex space-x-2">
              <Button
                variant={location.pathname === "/" ? "default" : "ghost"}
                size="sm"
                asChild
              >
                <Link to="/" className="flex items-center">
                  <ListCheck className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
              </Button>

              <Button
                variant={location.pathname === "/lists" ? "default" : "ghost"}
                size="sm"
                asChild
              >
                <Link to="/lists" className="flex items-center">
                  <List className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Lists</span>
                </Link>
              </Button>

              <Button
                variant={location.pathname === "/calendar" ? "default" : "ghost"}
                size="sm"
                asChild
              >
                <Link to="/calendar" className="flex items-center">
                  <CalendarDays className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Calendar</span>
                </Link>
              </Button>

              <div className="flex-1"></div>

              <Button size="sm" asChild>
                <Link to="/create-list" className="flex items-center">
                  <Plus className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">New List</span>
                </Link>
              </Button>
            </div>
          </div>
        </nav>
      )}

      <main className="flex-1 container mx-auto px-4 py-6">{children}</main>

      <footer className="border-t bg-gray-50">
        <div className="container mx-auto px-4 py-4 text-center text-gray-500 text-sm">
          Todo Streaks App &copy; {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
};

export default Layout;
