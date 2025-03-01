
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./lib/firebase";
import TodoService from "./services/todoService";
import Index from "./pages/Index";
import ListView from "./pages/ListView";
import CalendarView from "./pages/CalendarView";
import CalendarListView from "./pages/CalendarListView";
import CreateListModal from "./components/CreateListModal";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: true,
    },
  },
});

// Initialize the todo service and make it globally available
const todoService = new TodoService(queryClient);
declare global {
  interface Window {
    todoService: typeof todoService;
  }
}
window.todoService = todoService;

const App = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={user ? <CalendarListView /> : <Navigate to="/login" />} />
            <Route path="/lists" element={user ? <Index /> : <Navigate to="/login" />} />
            <Route path="/list/:id" element={user ? <ListView /> : <Navigate to="/login" />} />
            <Route path="/calendar" element={user ? <CalendarView /> : <Navigate to="/login" />} />
            <Route 
              path="/create-list" 
              element={user ? (
                <CreateListModal onCreateList={(title, description) => 
                  todoService.createList(title, description)
                } />
              ) : <Navigate to="/login" />} 
            />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
