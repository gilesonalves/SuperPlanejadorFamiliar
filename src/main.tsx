import { createRoot } from "react-dom/client";
import { bindTrialHookOnce } from "@/lib/supabase";
import App from "./App";
import "./index.css";

bindTrialHookOnce();

createRoot(document.getElementById("root")!).render(<App />);
