
function Footer() {
  return (
    <footer className="bg-gray-950 text-white">

      <div className="max-w-7xl mx-auto px-6 py-14">

        <div className="grid grid-cols-1 md:grid-cols-2
                        lg:grid-cols-4 gap-10">

          {/* Brand */}
          <div>

            <h2 className="text-2xl font-bold text-white">
              Pitch<span className="text-blue-500">Bid</span>
            </h2>

            <p className="text-gray-400 mt-4 leading-6 max-w-sm">
              A smarter way to organize cricket player auctions,
              build competitive teams, and manage every bid in one place.
            </p>

          </div>


          {/* Platform */}
          <div>

            <h3 className="font-semibold text-lg mb-4">
              Platform
            </h3>

            <ul className="space-y-3 text-gray-400">

              <li>
                <a
                  href="#how-it-works"
                  className="hover:text-white transition"
                >
                  How It Works
                </a>
              </li>

              <li>
                <a
                  href="#roles"
                  className="hover:text-white transition"
                >
                  Roles
                </a>
              </li>

              <li>
                <a
                  href="#auctions"
                  className="hover:text-white transition"
                >
                  Auctions
                </a>
              </li>

              <li>
                <a
                  href="#features"
                  className="hover:text-white transition"
                >
                  Features
                </a>
              </li>

            </ul>

          </div>


          {/* Get Started */}
          <div>

            <h3 className="font-semibold text-lg mb-4">
              Get Started
            </h3>

            <ul className="space-y-3 text-gray-400">

              <li>
                <a
                  href="/login"
                  className="hover:text-white transition"
                >
                  Login
                </a>
              </li>

              <li>
                <a
                  href="/register"
                  className="hover:text-white transition"
                >
                  Create Account
                </a>
              </li>

              <li>
                <a
                  href="#auctions"
                  className="hover:text-white transition"
                >
                  Browse Auctions
                </a>
              </li>

              <li>
                <a
                  href="#"
                  className="hover:text-white transition"
                >
                  Create Auction
                </a>
              </li>

            </ul>

          </div>


          {/* Contact */}
          <div>

            <h3 className="font-semibold text-lg mb-4">
              PitchBid
            </h3>

            <p className="text-gray-400 leading-6">
              Bringing players, teams, and auction creators together
              through a simple cricket auction experience.
            </p>

          </div>

        </div>


        {/* Divider */}
        <div className="border-t border-gray-800 mt-12 pt-6
                        flex flex-col md:flex-row
                        justify-between items-center gap-4">

          <p className="text-gray-500 text-sm">
            © 2026 PitchBid. All rights reserved.
          </p>

          <div className="flex gap-6 text-sm text-gray-500">

            <a
              href="#"
              className="hover:text-white transition"
            >
              Privacy Policy
            </a>

            <a
              href="#"
              className="hover:text-white transition"
            >
              Terms & Conditions
            </a>

          </div>

        </div>

      </div>

    </footer>
  );
}

export default Footer;
