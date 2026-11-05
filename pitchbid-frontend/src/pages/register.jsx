
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { registerCreator } from "../api/authApi";

function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    // Validate empty fields
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    // Backend requires a minimum of 8 characters
    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    // Validate password match
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      // Send registration request to Spring Boot
      const response = await registerCreator({
        name: name.trim(),
        email: email.trim(),
        password: password,
      });

      // Save user details and JWT token
      login(response);

      // Redirect after successful registration
      navigate("/dashboard", { replace: true });

    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Registration failed. Please try again.";

      setError(message);

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6 py-12">

      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">

          <Link to="/" className="text-3xl font-bold">
            Pitch<span className="text-blue-600">Bid</span>
          </Link>

          <h1 className="text-2xl font-bold text-gray-900 mt-6">
            Create Your Account
          </h1>

          <p className="text-gray-500 mt-2">
            Join PitchBid and start participating in cricket auctions.
          </p>

        </div>

        {/* Register Card */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">

          <form onSubmit={handleSubmit}>

            {/* Error */}
            {error && (
              <div className="mb-5 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* Full Name */}
            <div className="mb-5">

              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                maxLength={100}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />

            </div>

            {/* Email */}
            <div className="mb-5">

              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                maxLength={150}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />

            </div>

            {/* Password */}
            <div className="mb-5">

              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                maxLength={72}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />

            </div>

            {/* Confirm Password */}
            <div className="mb-6">

              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm Password
              </label>

              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />

            </div>

            {/* Register Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>

          </form>

          {/* Login */}
          <div className="text-center mt-6">

            <p className="text-gray-500 text-sm">
              Already have an account?{" "}

              <Link
                to="/login"
                className="text-blue-600 font-semibold hover:text-blue-800"
              >
                Login
              </Link>

            </p>

          </div>

        </div>

        {/* Back Home */}
        <div className="text-center mt-6">

          <Link
            to="/"
            className="text-gray-500 text-sm hover:text-blue-600"
          >
            ← Back to Home
          </Link>

        </div>

      </div>

    </div>
  );
}

export default Register;
