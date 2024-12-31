import { AppThemeProvider } from "./context/themeContext";
import Home from "./pages/Home";

function App() {
  return (
    <>
      <AppThemeProvider>
        <Home />
      </AppThemeProvider>
    </>
  );
}

export default App;
