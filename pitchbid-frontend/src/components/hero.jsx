function Hero() {
  return (
    <section className="bg-blue-50 min-h-[600px] flex items-center">

      <div className="max-w-7xl mx-auto px-6 w-full">

        <div className="max-w-3xl">

          <p className="text-blue-600 font-semibold text-lg mb-4">
            CRICKET AUCTION PLATFORM
          </p>

          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
            Every Bid
            <span className="text-blue-600"> Creates a Team.</span>
          </h1>

          <p className="text-gray-600 text-lg mt-6 max-w-2xl leading-relaxed">
            PitchBid is a modern cricket auction platform where teams
            compete for players, manage their budgets, and build their
            dream squad through live bidding.
          </p>

        </div>

      </div>

    </section>
  );
}

export default Hero;