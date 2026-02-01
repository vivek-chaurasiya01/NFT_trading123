import React, { useState } from "react";
import { FaPhone, FaEnvelope, FaUser, FaComment } from "react-icons/fa";
import Swal from "sweetalert2";
import { contactAPI } from "../services/api";

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    description: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { name, email, phone, description } = formData;

    if (!name || !email || !phone || !description) {
      Swal.fire("Error", "Please fill all fields", "error");
      return;
    }

    setLoading(true);

    try {
      await contactAPI.create({
        name,
        email,
        phone,
        description,
      });

      Swal.fire({
        icon: "success",
        title: "Contact Form Submitted!",
        text: "We will get back to you soon.",
        confirmButtonColor: "#0f7a4a",
      });

      setFormData({
        name: "",
        email: "",
        phone: "",
        description: "",
      });
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "Server error",
        "error",
      );
    }

    setLoading(false);
  };

  return (
    <div className="min-h-[100px] bg-[#f4f7f6]">
      {/* Wrapper */}
      <div className="w-full md:max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-6 px-4 md:px-0 pt-6 md:pt-10">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Contact Us</h2>
          <p className="text-gray-600 text-sm">Get in touch with our team</p>
        </div>

        {/* Form Card */}
        <div className="bg-white md:rounded-2xl shadow-sm p-4 md:p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0f7a4a]"
                  placeholder="Enter your name"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0f7a4a]"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mobile Number
              </label>
              <div className="relative">
                <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0f7a4a]"
                  placeholder="Enter your mobile number"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Message
              </label>
              <div className="relative">
                <FaComment className="absolute left-3 top-4 text-gray-400" />
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0f7a4a]"
                  placeholder="Write your query here..."
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#0f7a4a] to-green-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Submit"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
