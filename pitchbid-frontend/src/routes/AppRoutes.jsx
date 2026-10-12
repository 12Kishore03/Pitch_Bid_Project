
import { Routes, Route } from "react-router-dom";

import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/Dashboard";

import ProtectedRoutes from "./ProtectedRoutes";
import CreateAuction from "../pages/createAuction";
import PlayerRegistration from "../pages/PlayerRegistration";
import TeamOwnerRegistration from "../pages/teamOwnerRegistration";
import JoinAuction from "../pages/joinAuction";


function AppRoutes() {

  return (
    <Routes>

      {/* =========================
          PUBLIC ROUTES
      ========================== */}

      <Route
        path="/"
        element={<Home />}
      />

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />


      {/* =========================
          PROTECTED ROUTES
      ========================== */}

      <Route
        path="/dashboard"
        element={
          <ProtectedRoutes>
            <Dashboard />
          </ProtectedRoutes>
        }
      />

      <Route
  path="/create-auction"
  element={
    <ProtectedRoutes>
      <CreateAuction />
    </ProtectedRoutes>
  }/>

  {/* <Route
  path="/join-auction/:auctionId"
  element={<PlayerRegistration />}
/> */}

 <Route
  path="/join-auction/:auctionId"
  element={<JoinAuction />}
/>

    </Routes>
  );
}


export default AppRoutes;

