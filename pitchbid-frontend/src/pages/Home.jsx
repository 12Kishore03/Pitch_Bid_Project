import Features from "../components/features";
import Hero from "../components/hero";
import Navbar from "../components/navbar";
import HowItWorks from "../components/HowItWorks";
import Roles from "../components/roles";
import FeaturedAuctions from "../components/featuredAuction";
import CallToAction from "../components/callToAuction";
import Footer from "../components/footer";


function Home() {
  return (
    <div>

      <Navbar/>
      <Hero/>
      <Features/>
     <HowItWorks/>
     <Roles/>
     <FeaturedAuctions/>
     <CallToAction/>
     <Footer/>

    </div>
  );
}

export default Home;