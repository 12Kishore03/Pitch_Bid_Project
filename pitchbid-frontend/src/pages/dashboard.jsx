import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">

          {/* Logo */}
          <button
            onClick={() => navigate("/dashboard")}
            className="text-2xl font-bold"
          >
            Pitch<span className="text-blue-600">Bid</span>
          </button>

          {/* User + Logout */}
          <div className="flex items-center gap-5">

            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-gray-900">
                {user?.name}
              </p>

              <p className="text-xs text-gray-500">
                {user?.email}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Logout
            </button>

          </div>
        </div>
      </nav>


      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">

        {/* Welcome Section */}
        <div className="mb-10">

          <p className="text-blue-600 font-semibold">
            Dashboard
          </p>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">
            Welcome, {user?.name} 👋
          </h1>

          <p className="text-gray-600 mt-3">
            Create your own cricket auction and  join an existing one via links .
          </p>

        </div>


        {/* Main Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* Create Auction */}
          <div className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-xl transition">

            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
              <span className="text-blue-600 text-2xl font-bold">
                +
              </span>
            </div>

            <h2 className="text-2xl font-bold text-gray-900">
              Create an Auction
            </h2>

            <p className="text-gray-600 mt-3 leading-6">
              Create your own cricket auction, configure the rules,
              invite players and teams, and manage the complete
              auction process.
            </p>

            <button
              onClick={() => navigate("/create-auction")}
              className="mt-7 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
            >
              Create Auction
            </button>

          </div>


          {/* Join Auction */}
          {/* <div className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-xl transition">

            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
              <span className="text-blue-600 text-2xl font-bold">
                →
              </span>
            </div>

            <h2 className="text-2xl font-bold text-gray-900">
              Join an Auction
            </h2>

            <p className="text-gray-600 mt-3 leading-6">
              Join an existing cricket auction using an auction
              link or code and participate as a player or team owner.
            </p>

            <button
              onClick={() => navigate("/join-auction")}
              className="mt-7 border border-blue-600 text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-blue-600 hover:text-white transition"
            >
              Join Auction
            </button>

          </div>  */}

        </div>


        {/* My Activity */}
        <section className="mt-12">

          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            My Activity
          </h2>

          <div className="bg-white border border-gray-200 rounded-2xl p-8">

            <div className="text-center py-8">

              <p className="text-gray-500">
                You haven't created or joined any auctions yet.
              </p>

              <p className="text-gray-400 text-sm mt-2">
                Create an auction or join one to get started.
              </p>

            </div>

          </div>

        </section>

      </main>
    </div>
  );
}

export default Dashboard;