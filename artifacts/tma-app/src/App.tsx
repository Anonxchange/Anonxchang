import { Switch, Route, Router as WouterRouter } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/Layout";
import Home from "@/pages/Home";
import Tasks from "@/pages/Tasks";
import Referral from "@/pages/Referral";
import Tokens from "@/pages/Tokens";
import Leaderboard from "@/pages/Leaderboard";
import { TelegramProvider } from "@/components/TelegramProvider";
import { Web3Provider } from "@/components/Web3Provider";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/tasks" component={Tasks} />
        <Route path="/referral" component={Referral} />
        <Route path="/tokens" component={Tokens} />
        <Route path="/leaderboard" component={Leaderboard} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <Web3Provider>
      <TelegramProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </TelegramProvider>
    </Web3Provider>
  );
}

export default App;
