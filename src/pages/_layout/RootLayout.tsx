import { Outlet } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";

const RootLayout = () => (
  <AppShell>
    <Outlet />
  </AppShell>
);

export default RootLayout;