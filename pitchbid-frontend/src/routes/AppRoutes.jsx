import { Routes, Route } from "react-router-dom";

import Home from "../pages/Home";
import Login from "../pages/login";
import Register from "../pages/Register";
import Dashboard from "../pages/dashboard";

import ProtectedRoutes from "./ProtectedRoutes";
import CreateAuction from "../pages/createAuction";
import JoinAuction from "../pages/joinAuction";
import AuctionDetails from "../pages/auctionDetails";
import AuctionManagement from "../pages/auctionManagement";
import PlayersRegistrationCreatorManage from "../pages/PlayersRegistrationCreatorManage";
import TeamOwnerManagement from "../pages/teamOwnerManagement";
import LiveAuction from "../pages/LiveAuction";
import TeamManagement from "../pages/TeamManagement";
import PlayerManagement from "../pages/PlayerManagement";

function AppRoutes() {
  return (
    <Routes>
      {/* PUBLIC ROUTES */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* PROTECTED ROUTES */}
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
        }
      />

      <Route path="/join-auction/:auctionId" element={<JoinAuction />} />

      <Route
        path="/auction/:auctionId"
        element={
          <ProtectedRoutes>
            <AuctionDetails />
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

      {/* Player registration approval/rejection page */}
      <Route
        path="/auction-management/:auctionId/player-registrations"
        element={
          <ProtectedRoutes>
            <PlayersRegistrationCreatorManage />
          </ProtectedRoutes>
        }
      />

      {/* Approved player management page */}
      <Route
        path="/auction-management/:auctionId/players"
        element={
          <ProtectedRoutes>
            <PlayerManagement />
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

      <Route
        path="/auction-management/:auctionId/teams"
        element={
          <ProtectedRoutes>
            <TeamManagement />
          </ProtectedRoutes>
        }
      />

      <Route
        path="/live-auction/:auctionId"
        element={
          <ProtectedRoutes>
            <LiveAuction />
          </ProtectedRoutes>
        }
      />
    </Routes>
  );
}

export default AppRoutes;
