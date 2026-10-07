function Features() {
  const features = [
    {
      title: "Create Auctions",
      description:
        "Create a cricket auction, define the rules, set the budget, and prepare your player pool.",
    },
    {
      title: "Live Bidding",
      description:
        "Run an interactive auction where teams compete for players through real-time bidding.",
    },
    {
      title: "Team Management",
      description:
        "Team owners can manage their squad, track their remaining budget, and monitor purchases.",
    },
    {
      title: "Player Registration",
      description:
        "Players can register for available auctions and provide their profile and playing details.",
    },
    {
      title: "Auction Results",
      description:
        "View complete auction results including players, winning teams, and final bid amounts.",
    },
    {
      title: "Export Results",
      description:
        "Generate downloadable auction reports containing important bidding and team information.",
    },
  ];

  return (
    <section id="features" className="py-20 bg-white">

      <div className="max-w-7xl mx-auto px-6">

        {/* Section heading */}
        <div className="text-center max-w-2xl mx-auto">

          <p className="text-blue-600 font-semibold">
            FEATURES
          </p>

          <h2 className="text-4xl font-bold text-gray-900 mt-2">
            Everything You Need for a Cricket Auction
          </h2>

          <p className="text-gray-600 mt-4">
            PitchBid provides the tools required to organize,
            manage, and participate in a complete cricket auction.
          </p>

        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">

          {features.map((feature, index) => (
            <div
              key={index}
              className="p-6 border border-gray-200 rounded-xl hover:shadow-lg hover:border-blue-200 transition"
            >

              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold text-lg">
                {index + 1}
              </div>

              <h3 className="text-xl font-semibold text-gray-900 mt-5">
                {feature.title}
              </h3>

              <p className="text-gray-600 mt-3 leading-relaxed">
                {feature.description}
              </p>

            </div>
          ))}

        </div>

      </div>

    </section>
  );
}

export default Features;