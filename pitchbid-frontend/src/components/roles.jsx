function Roles() {
  const roles = [
    {
      title: "Platform Admin",
      description:
        "Manages the PitchBid platform, monitors auctions, users, and overall system activity.",
      features: [
        "Manage users",
        "Monitor auctions",
        "View platform activity",
        "Manage system settings",
      ],
    },
    {
      title: "Auction Creator",
      description:
        "Creates and manages an auction from registration to the final results.",
      features: [
        "Create auctions",
        "Manage players and teams",
        "Approve registrations",
        "Control live auction",
      ],
    },
    {
      title: "Team Owner",
      description:
        "Builds a competitive squad by participating in live bidding within the available budget.",
      features: [
        "Register a team",
        "Manage budget",
        "Place live bids",
        "Build your squad",
      ],
    },
    {
      title: "Player",
      description:
        "Registers for an auction, creates a cricket profile, and participates in the player auction.",
      features: [
        "Create player profile",
        "Register for auctions",
        "View auction status",
        "Track final result",
      ],
    },
  ];

  return (
    <section id="roles" className="py-20 bg-gray-50">

      <div className="max-w-7xl mx-auto px-6">

        {/* Heading */}
        <div className="text-center mb-14">

          <p className="text-blue-600 font-semibold uppercase tracking-wider">
            Roles
          </p>

          <h2 className="text-4xl font-bold text-gray-900 mt-3">
            One Platform, Different Roles
          </h2>

          <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
            PitchBid provides a dedicated experience for every person
            involved in a cricket auction.
          </p>

        </div>


        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

          {roles.map((role, index) => (

            <div
              key={index}
              className="bg-white border border-gray-200 rounded-2xl p-7
                         hover:shadow-xl hover:-translate-y-1
                         transition-all duration-300"
            >

              {/* Number */}
              <div
                className="w-12 h-12 rounded-xl bg-blue-100
                           flex items-center justify-center
                           text-blue-600 font-bold text-lg mb-6"
              >
                {index + 1}
              </div>


              {/* Title */}
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {role.title}
              </h3>


              {/* Description */}
              <p className="text-gray-600 text-sm leading-6 mb-6">
                {role.description}
              </p>


              {/* Features */}
              <ul className="space-y-3">

                {role.features.map((feature, featureIndex) => (

                  <li
                    key={featureIndex}
                    className="flex items-center gap-2 text-sm text-gray-600"
                  >
                    <span className="text-blue-600 font-bold">
                      ✓
                    </span>

                    {feature}

                  </li>

                ))}

              </ul>

            </div>

          ))}

        </div>

      </div>

    </section>
  );
}

export default Roles;