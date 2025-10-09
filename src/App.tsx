// src/App.tsx
import { Navigate, createBrowserRouter, RouterProvider } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import RequireAuth from "@/routes/RequireAuth";
import Shopping from "@/pages/Shopping";
import Pricing from "@/pages/Pricing";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import Profile from "@/pages/auth/Profile";
import WalletManager from "./components/WalletManager";
import BudgetManager from "./components/BudgetManager";
import Dashboard from "./components/Dashboard";

const router = createBrowserRouter([
  // públicas
  { path: "/login", element: <Login /> },
  { path: "/pricing", element: <Pricing /> },
  { path: "/register", element: <Register /> },
  { path: "/forgot", element: <ForgotPassword /> },

  // layout + privadas
  {
    element: <AppShell />,  // contém <Outlet />
    children: [
      {
        element: <RequireAuth />,  // protege tudo abaixo
        children: [
          { index: true, element: <Navigate to="/home" replace /> },
          { path: "home", element: <Dashboard /> },
          { path: "wallet", element: <WalletManager /> },   // 👈 aqui
          { path: "budget", element: <BudgetManager /> },   // 👈 aqui
          { path: "shopping", element: <Shopping /> },
          { path: "profile", element: <Profile /> },
        ],
      },
    ],
  },

  { path: "*", element: <Navigate to="/home" replace /> },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
