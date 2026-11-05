
import { useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { loginCreator } from "../api/authApi";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const { login } = useAuth();

  const redirectTo =
    location.state?.from?.pathname || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!email.trim() || !password) {
      setError("Please enter email and password.");
      return;
    }

    try {
      setLoading(true);

      // Send login request to Spring Boot.
      const response = await loginCreator({
        email: email.trim(),
        password: password,
      });

      // Save JWT token and user details.
      login(response);

      // Redirect after successful login.
      navigate(redirectTo, { replace: true });

    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Unable to login. Please check your credentials and try again.";

      setError(message);

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">

      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">

          <Link to="/" className="text-3xl font-bold">
            Pitch<span className="text-blue-600">Bid</span>
          </Link>

          <h1 className="text-2xl font-bold text-gray-900 mt-6">
            Welcome Back
          </h1>

          <p className="text-gray-500 mt-2">
            Login to continue to your PitchBid account
          </p>

        </div>

        {/* Login Card */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">

          <form onSubmit={handleSubmit}>

            {/* Error */}
            {error && (
              <div className="mb-5 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

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
                required
                autoComplete="email"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />

            </div>

            {/* Password */}
            <div className="mb-6">

              <div className="flex justify-between mb-2">

                <label className="text-sm font-semibold text-gray-700">
                  Password
                </label>

                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Forgot password?
                </a>

              </div>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />

            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Logging in..." : "Login"}
            </button>

          </form>

          {/* Register */}
          <div className="text-center mt-6">

            <p className="text-gray-500 text-sm">

              Don't have an account?{" "}

              <Link
                to="/register"
                className="text-blue-600 font-semibold hover:text-blue-800"
              >
                Create Account
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

export default Login;
