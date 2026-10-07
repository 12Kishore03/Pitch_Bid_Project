
function FeaturedAuctions() {

  const auctions = [
    {
      name: "Corporate Cricket League 2026",
      location: "Chennai",
      teams: 8,
      players: 64,
      status: "Registration Open",
      date: "Oct 10, 2026",
    },
    {
      name: "College Cricket Championship",
      location: "Coimbatore",
      teams: 6,
      players: 48,
      status: "Registration Open",
      date: "Oct 18, 2026",
    },
    {
      name: "Weekend Premier League",
      location: "Bangalore",
      teams: 10,
      players: 80,
      status: "Upcoming",
      date: "Nov 02, 2026",
    },
  ];

  return (
    <section id="auctions" className="py-20 bg-white">

      <div className="max-w-7xl mx-auto px-6">

        {/* Heading */}
        <div className="text-center mb-14">

          <p className="text-blue-600 font-semibold uppercase tracking-wider">
            Featured Auctions
          </p>

          <h2 className="text-4xl font-bold text-gray-900 mt-3">
            Discover Live Cricket Auctions
          </h2>

          <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
            Explore upcoming cricket auctions and join the ones
            that match your game.
          </p>

        </div>


        {/* Auction Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

          {auctions.map((auction, index) => (

            <div
              key={index}
              className="border border-gray-200 rounded-2xl overflow-hidden
                         hover:shadow-xl transition duration-300"
            >

              {/* Card Header */}
              <div className="bg-blue-600 px-6 py-5">

                <div className="flex items-center justify-between">

                  <span className="text-blue-100 text-sm">
                    {auction.date}
                  </span>

                  <span className="bg-white text-blue-600
                                   px-3 py-1 rounded-full
                                   text-xs font-semibold">
                    {auction.status}
                  </span>

                </div>

              </div>


              {/* Card Body */}
              <div className="p-6">

                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {auction.name}
                </h3>

                <p className="text-gray-500 text-sm mb-6">
                  {auction.location}
                </p>


                {/* Auction Details */}
                <div className="grid grid-cols-2 gap-4 mb-6">

                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-2xl font-bold text-gray-900">
                      {auction.teams}
                    </p>

                    <p className="text-sm text-gray-500">
                      Teams
                    </p>
                  </div>


                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-2xl font-bold text-gray-900">
                      {auction.players}
                    </p>

                    <p className="text-sm text-gray-500">
                      Players
                    </p>
                  </div>

                </div>


                {/* Button */}
                <button
                  className="w-full border border-blue-600
                             text-blue-600 py-3 rounded-xl
                             font-semibold
                             hover:bg-blue-600 hover:text-white
                             transition duration-300"
                >
                  View Auction
                </button>

              </div>

            </div>

          ))}

        </div>


        {/* View All */}
        <div className="text-center mt-10">

          <button
            className="text-blue-600 font-semibold
                       hover:text-blue-800 transition"
          >
            View All Auctions →
          </button>

        </div>

      </div>

    </section>
  );
}

export default FeaturedAuctions;

