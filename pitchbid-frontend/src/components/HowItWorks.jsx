
function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Create an Auction",
      description:
        "The administrator creates an auction and defines the auction details, budget, and player pool.",
    },
    {
      number: "02",
      title: "Register Players & Teams",
      description:
        "Players and team owners register for the auction using the provided registration process.",
    },
    {
      number: "03",
      title: "Start Live Bidding",
      description:
        "The auction begins and registered teams compete for players through live bidding.",
    },
    {
      number: "04",
      title: "Build Your Squad",
      description:
        "Players are assigned to the highest bidding teams while their budgets are updated.",
    },
  ];

  return (
    <section
      id="how-it-works"
      className="py-20 bg-blue-50"
    >

      <div className="max-w-7xl mx-auto px-6">

        {/* Heading */}
        <div className="text-center max-w-2xl mx-auto">

          <p className="text-blue-600 font-semibold">
            HOW IT WORKS
          </p>

          <h2 className="text-4xl font-bold text-gray-900 mt-2">
            From Registration to Winning Squad
          </h2>

          <p className="text-gray-600 mt-4">
            Follow four simple steps to organize and participate
            in a PitchBid cricket auction.
          </p>

        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">

          {steps.map((step) => (
            <div
              key={step.number}
              className="bg-white p-6 rounded-xl border border-gray-200"
            >

              <span className="text-4xl font-bold text-blue-600">
                {step.number}
              </span>

              <h3 className="text-xl font-semibold text-gray-900 mt-4">
                {step.title}
              </h3>

              <p className="text-gray-600 mt-3 leading-relaxed">
                {step.description}
              </p>

            </div>
          ))}

        </div>

      </div>

    </section>
  );
}

export default HowItWorks;