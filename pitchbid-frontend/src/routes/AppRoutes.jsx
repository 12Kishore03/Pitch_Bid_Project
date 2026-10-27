
import { Routes, Route } from "react-router-dom";

import Home from "../pages/Home";
import Login from "../pages/login";
import Register from "../pages/Register";
import Dashboard from "../pages/dashboard";

import ProtectedRoutes from "./ProtectedRoutes";
import CreateAuction from "../pages/createAuction";
import PlayerRegistration from "../pages/PlayerRegistration";
import TeamOwnerRegistration from "../pages/teamOwnerRegistration";
import JoinAuction from "../pages/joinAuction";
import AuctionDetails from "../pages/auctionDetails";
import AuctionManagement from "../pages/auctionManagement";
import EditAuction from "../pages/editAcution";
import PlayersRegistrationCreatorManage from "../pages/PlayersRegistrationCreatorManage";
import TeamOwnerManagement from "../pages/teamOwnerManagement";


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

<Route
  path="/auction/:auctionId"
  element={
    <ProtectedRoutes>
      <AuctionDetails />
    </ProtectedRoutes>
  }
/>


<Route
  path="/edit-auction/:auctionId"
  element={
    <ProtectedRoutes>
      <EditAuction />
    </ProtectedRoutes>
  }
/>

<Route
  path="/auction-management/:auctionId"
  element={
    <ProtectedRoutes>
      <AuctionManagement />
    </ProtectedRoutes>
  }
/>


<Route
  path="/auction-management/:auctionId/players"
  element={
    <ProtectedRoutes>
      <PlayersRegistrationCreatorManage />
    </ProtectedRoutes>
  }
/>

<Route
  path="/auction-management/:auctionId/owners"
  element={
    <ProtectedRoutes>
      <TeamOwnerManagement />
    </ProtectedRoutes>
  }
/>


    </Routes>
  );
}


export default AppRoutes;

