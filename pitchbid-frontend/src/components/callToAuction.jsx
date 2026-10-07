
import { useNavigate } from "react-router-dom";

function CallToAction() {
  const navigate = useNavigate();

  return (
    <section className="py-20 bg-blue-600">

      <div className="max-w-5xl mx-auto px-6 text-center">

        {/* Heading */}
        <h2 className="text-4xl md:text-5xl font-bold text-white">
          Ready to Start Your Cricket Auction?
        </h2>

        {/* Description */}
        <p className="text-blue-100 text-lg mt-5 max-w-2xl mx-auto">
          Create your own auction, build your team, or join an existing
          auction and experience a smarter way to build your squad.
        </p>


        {/* Buttons */}
        <div className="flex flex-col sm:flex-row justify-center
                        items-center gap-4 mt-8">

          <button
            onClick={() => navigate("/login")}
            className="bg-white text-blue-600 px-8 py-3 rounded-xl
                       font-semibold hover:bg-gray-100
                       transition duration-300 w-full sm:w-auto"
          >
            Create an Auction
          </button>


          <button
            className="border border-white text-white px-8 py-3
                       rounded-xl font-semibold
                       hover:bg-white hover:text-blue-600
                       transition duration-300 w-full sm:w-auto"
          >
            Join an Auction
          </button>

        </div>

      </div>

    </section>
  );
}

export default CallToAction;


