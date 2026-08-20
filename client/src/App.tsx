import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import { SocketContextProvider } from "@context/SocketContext";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <SocketContextProvider>
      <main>
        <Box className="w-full h-svh">
          <Outlet />
          <Toaster position="bottom-right" />
        </Box>
      </main>
    </SocketContextProvider>
  );
}

export default App;
