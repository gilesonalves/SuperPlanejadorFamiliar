import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import RootLayout from "@/pages/_layout/RootLayout";
import Index from "@/pages/Index";
import Wallet from "@/pages/Wallet";
import Budget from "@/pages/Budget";
import Shopping from "@/pages/Shopping";
import NotFound from "@/pages/NotFound";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import Profile from "@/pages/auth/Profile";

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <RootLayout />,
      children: [
        { index: true, element: <Index /> },
        { path: "wallet", element: <Wallet /> },
        { path: "budget", element: <Budget /> },
        { path: "shopping", element: <Shopping /> },
        { path: "login", element: <Login /> },
        { path: "register", element: <Register /> },
        { path: "forgot", element: <ForgotPassword /> },
        { path: "profile", element: <Profile /> },
        { path: "*", element: <NotFound /> },
      ],
    },
  ],
  { future: { v7_startTransition: true, v7_relativeSplatPath: true } },
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <RouterProvider router={router} />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
