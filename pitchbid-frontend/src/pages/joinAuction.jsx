import { useSearchParams } from "react-router-dom";
import PlayerRegistration from "./PlayerRegistration";
import TeamOwnerRegistration from "./teamOwnerRegistration";

function JoinAuction() {
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role");

  if (role === "player") {
    return <PlayerRegistration />;
  }

  if (role === "owner") {
    return <TeamOwnerRegistration />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-blue-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl font-bold text-red-600">
          !
        </div>

        <h1 className="mt-5 text-2xl font-bold text-blue-950">
          Invalid Registration Link
        </h1>

        <p className="mt-3 text-gray-600">
          This invitation link is missing a valid registration
          role. Please use the player or team owner link provided
          by the auction creator.
        </p>
      </div>
    </div>
  );
}

export default JoinAuction;