import { Routes, Route, Navigate } from "react-router-dom";
import Spinner from "./components/Spinner.jsx";
import { useAuth } from "./hooks/useAuth.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ProjectLogs from "./pages/ProjectLogs.jsx";
import ProjectSettings from "./pages/ProjectSettings.jsx";
import ProjectAlerts from "./pages/ProjectAlerts.jsx";


const WakingUpSplash = () => (
  <div style={{
    position: "fixed",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "20px",
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    color: "#e2e8f0",
    fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
  }}>

    <Spinner size={50} color1="#fff" color2="#289E49" />

    <div style={{ textAlign: "center", maxWidth: 340 }}>
      <p style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "#f1f5f9" }}>
        Server is waking up…
      </p>
      <p style={{
        margin: "8px 0 0",
        fontSize: 14,
        color: "#94a3b8",
        lineHeight: 1.6,
      }}>
        The backend spins down after inactivity. It usually takes&nbsp;
        <strong style={{ color: "#a5b4fc" }}>20–30 seconds</strong> to come
        back. Hang tight — you won't be logged out.
      </p>
    </div>


    <div style={{ display: "flex", gap: 6 }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#6366f1",
            animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
            display: "inline-block",
          }}
        />
      ))}
    </div>

    <style>{`
      @keyframes pulse {
        0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
        40%            { opacity: 1;   transform: scale(1);   }
      }
    `}</style>
  </div>
);


const LoadingScreen = () => (
  <div style={{
    position: "fixed",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0f172a",
  }}>
    <Spinner size={50} color1="#fff" color2="#289E49" />
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { user, loading, wakingUp } = useAuth();
  if (wakingUp) return <WakingUpSplash />;
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};


const App = () => {
  const { user, loading, wakingUp } = useAuth();

  if (wakingUp) return <WakingUpSplash />;
  if (loading) return <LoadingScreen />;

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:projectId"
        element={
          <ProtectedRoute>
            <ProjectLogs />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:projectId/settings"
        element={
          <ProtectedRoute>
            <ProjectSettings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:projectId/alerts"
        element={
          <ProtectedRoute>
            <ProjectAlerts />
          </ProtectedRoute>
        }
      />
      <Route
        path="*"
        element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
      />
    </Routes>
  );
};

export default App;
