import React, { useState } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../services/api";

const Login = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.email || !formData.password) {
      Swal.fire({
        icon: "warning",
        title: "Missing Fields",
        text: "Please fill all fields",
        confirmButtonColor: "#0f7a4a",
      });
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.login(formData);
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // Check if user needs activation
      if (response.data.needsActivation || !response.data.user.isActive) {
        Swal.fire({
          icon: "warning",
          title: "Account Not Activated",
          text: "Please complete $10 payment to activate",
          confirmButtonColor: "#0f7a4a",
        });
        navigate("/activate");
        return;
      }

      Swal.fire({
        icon: "success",
        title: "Login Successful 🎉",
        confirmButtonColor: "#0f7a4a",
      });
      navigate("/dashbord");
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text: error.response?.data?.message || "Something went wrong",
        confirmButtonColor: "#0f7a4a",
      });
    }
    setLoading(false);
  };

  return (
    <div className="w-screen h-screen bg-[#eaf4ee] flex justify-center items-start md:items-center">
      {/* CARD */}
      <div
        className="
          w-full max-w-[390px] h-full bg-white flex flex-col overflow-hidden
          md:max-w-[460px] md:h-auto md:rounded-2xl md:shadow-2xl
        "
      >
        {/* ===== TOP CURVE ===== */}
        <div className="relative h-[230px] overflow-hidden shrink-0">
          <svg
            viewBox="0 0 375 230"
            className="absolute inset-0 w-full h-full"
            preserveAspectRatio="none"
          >
            <path d="M0 0 H375 V140 C300 200 75 200 0 140 Z" fill="#0f7a4a" />
          </svg>

          <div className="absolute -top-16 right-[-60px] w-[180px] h-[180px] bg-[#7fc8a2] rounded-full"></div>

          <div className="relative z-10 px-6 pt-10 text-white">
            <p className="text-sm font-medium">Hi,</p>
            <h1 className="text-[22px] font-bold">Please Login</h1>
          </div>
        </div>

        {/* ===== FORM ===== */}
        <div className="flex-1 flex justify-center pt-10 md:pt-8">
          <form className="w-full px-6 pb-10 md:px-10" onSubmit={handleSubmit}>
            {/* EMAIL */}
            <label className="text-sm font-bold text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              placeholder="email@test.com"
              value={formData.email}
              onChange={handleChange}
              className="
                w-full mt-2 px-4 py-[14px] rounded-md
                bg-white border border-black text-sm
                focus:outline-none focus:border-black focus:ring-0
              "
            />

            {/* PASSWORD */}
            <label className="text-sm font-bold text-gray-700 mt-4 block">
              Password
            </label>
            <input
              type="password"
              name="password"
              placeholder="********"
              value={formData.password}
              onChange={handleChange}
              className="
                w-full mt-2 px-4 py-[14px] rounded-md
                bg-white border border-black text-sm
                focus:outline-none focus:border-black focus:ring-0
              "
            />

            {/* LOGIN BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0f7a4a] text-white py-4 rounded-md font-bold mt-8 disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            {/* SIGNUP LINK */}
            <p className="text-center text-sm text-gray-600 mt-6">
              Not registered yet?{" "}
              <span
                onClick={() => navigate("/SingUp")}
                className="text-[#0f7a4a] font-semibold cursor-pointer hover:underline"
              >
                Create an account
              </span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
