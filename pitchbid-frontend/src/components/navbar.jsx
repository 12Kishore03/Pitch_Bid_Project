function Navbar() {
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* Logo */}
        <div className="text-2xl font-bold text-blue-600">
          PitchBid
        </div>

        {/* Navigation */}
        <div className="hidden md:flex items-center gap-8">

          <a
            href="/"
            className="text-gray-700 hover:text-blue-600 transition"
          >
            Home
          </a>

          <a
            href="#features"
            className="text-gray-700 hover:text-blue-600 transition"
          >
            Features
          </a>

          <a
            href="#how-it-works"
            className="text-gray-700 hover:text-blue-600 transition"
          >
            How It Works
          </a>

          <a
            href="#roles"
            className="text-gray-700 hover:text-blue-600 transition"
          >
            Roles
          </a>

        </div>

        {/* Login button */}
        {/* <button className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition">
          Login
        </button> */}

      </div>
    </nav>
  );
}

export default Navbar;