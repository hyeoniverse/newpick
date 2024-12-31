import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClientProvider } from "react-query";
import { queryClient } from "./api/queryClient";

import { AppThemeProvider } from "./context/themeContext";
import Home from "./pages/Home";

const routeList = [
  {
    path: "/",
    element: <Home />,
  },
];

const router = createBrowserRouter(
  routeList.map((item) => {
    return {
      ...item,
      element: item.element,
    };
  })
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppThemeProvider>
        <RouterProvider router={router} />
      </AppThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
