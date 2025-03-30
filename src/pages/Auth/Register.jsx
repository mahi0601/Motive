import React, { useState } from 'react';
import AuthLayout from '../../layout/AuthLayout';
import { motion } from 'framer-motion';
import { register } from '../../services/authService';

import {
  FiCheckCircle, FiCalendar, FiBarChart2, FiClipboard, FiList, FiBell, FiBookOpen,
  FiClock, FiEdit, FiFolder, FiHeart, FiInbox, FiLayers, FiMail, FiMessageCircle,
  FiPieChart, FiSearch, FiSettings, FiStar, FiTag, FiTrendingUp, FiUser, FiUsers,
  FiDatabase, FiArchive, FiCamera, FiCode, FiDownload, FiUpload, FiMonitor,
  FiPlay, FiPause, FiTool, FiGlobe, FiShield, FiSliders
} from 'react-icons/fi';

const iconComponents = [
  FiCheckCircle, FiCalendar, FiBarChart2, FiClipboard, FiList, FiBell, FiBookOpen,
  FiClock, FiEdit, FiFolder, FiHeart, FiInbox, FiLayers, FiMail, FiMessageCircle,
  FiPieChart, FiSearch, FiSettings, FiStar, FiTag, FiTrendingUp, FiUser, FiUsers,
  FiDatabase, FiArchive, FiCamera, FiCode, FiDownload, FiUpload, FiMonitor,
  FiPlay, FiPause, FiTool, FiGlobe, FiShield, FiSliders
];

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await register(form);
      alert('✅ Registration Successful!');
      console.log('Server Response:', res);
      // Redirect to login
      window.location.href = '/login';
    } catch (err) {
      console.error('Registration Error:', err);
      alert('❌ Registration Failed: ' + (err?.response?.data?.message || 'Server Error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="relative min-h-screen w-full bg-[#f5f6f8] flex items-center justify-center px-6 py-20 overflow-hidden font-[Inter]">
        {iconComponents.map((Icon, index) => {
          const top = Math.random() * 90;
          const left = Math.random() * 90;
          const size = Math.random() * 24 + 24;
          const opacity = Math.random() * 0.12 + 0.05;
          return (
            <motion.div
              key={index}
              className="absolute text-gray-300 select-none pointer-events-none"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity, scale: 1 }}
              transition={{ delay: index * 0.02, duration: 0.6 }}
              style={{
                top: `${top}%`,
                left: `${left}%`,
                fontSize: `${size}px`,
                zIndex: 0,
              }}
            >
              <Icon />
            </motion.div>
          );
        })}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 w-full max-w-2xl bg-white border border-gray-200 rounded-2xl shadow-xl px-12 py-14"
        >
          <h2 className="text-3xl font-extrabold text-center mb-6 text-gray-800 tracking-tight hover:text-indigo-500 transition-colors">
            📝 Create Your Account
          </h2>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                placeholder="John Doe"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full p-3 border border-gray-300 bg-white text-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">Email</label>
              <input
                type="email"
                placeholder="email@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="w-full p-3 border border-gray-300 bg-white text-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                className="w-full p-3 border border-gray-300 bg-white text-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 shadow-md"
            >
              {loading ? 'Registering...' : 'Register'}
            </motion.button>
          </form>

          <p className="text-sm text-gray-500 mt-6 text-center">
            Already have an account?{' '}
            <a href="/login" className="text-indigo-500 hover:underline">
              Login
            </a>
          </p>
        </motion.div>
      </div>
    </AuthLayout>
  );
};

export default Register;
