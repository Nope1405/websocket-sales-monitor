import Dashboard from './components/dashboard/Dashboard'

/**
 * Keeps application entry explicit and intentionally thin.
 *
 * Why this structure helps:
 * - Routing and shell concerns can be added here later without touching dashboard logic.
 * - The dashboard feature remains isolated and easy to reason about.
 */
function App() {
  return <Dashboard />
}

export default App
