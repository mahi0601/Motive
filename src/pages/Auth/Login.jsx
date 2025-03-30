import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../../layout/AuthLayout';
import { login } from '../../services/authService';
import { motion } from 'framer-motion';
import { gapi } from 'gapi-script';
import {
  FiCheckCircle, FiCalendar, FiBarChart2, FiClipboard, FiList, FiBell, FiBookOpen,
  FiClock, FiEdit, FiFolder, FiHeart, FiInbox, FiLayers, FiMail, FiMessageCircle,
  FiPieChart, FiSearch, FiSettings, FiStar, FiTag, FiTrendingUp, FiUser, FiUsers,
  FiDatabase, FiArchive, FiCamera, FiCode, FiDownload, FiUpload, FiMonitor,
  FiPlay, FiPause, FiTool, FiGlobe, FiShield, FiSliders
} from 'react-icons/fi';

const CLIENT_ID = '1094576727672-7dqakbaer20l2o50qs3u5vfiqdvin3jj.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/calendar.events';

const iconComponents = [
  FiCheckCircle, FiCalendar, FiBarChart2, FiClipboard, FiList, FiBell, FiBookOpen,
  FiClock, FiEdit, FiFolder, FiHeart, FiInbox, FiLayers, FiMail, FiMessageCircle,
  FiPieChart, FiSearch, FiSettings, FiStar, FiTag, FiTrendingUp, FiUser, FiUsers,
  FiDatabase, FiArchive, FiCamera, FiCode, FiDownload, FiUpload, FiMonitor,
  FiPlay, FiPause, FiTool, FiGlobe, FiShield, FiSliders
];

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    function start() {
      gapi.client.init({
        clientId: CLIENT_ID,
        scope: SCOPES,
      });
    }
    gapi.load('client:auth2', start);
  }, []);

  const handleGoogleSignIn = () => {
    const authInstance = gapi.auth2.getAuthInstance();
    authInstance.signIn().then((user) => {
      const profile = user.getBasicProfile();
      alert(`✅ Welcome ${profile.getName()}!`);
      navigate('/dashboard');
    }).catch((err) => {
      console.error('Google Sign-in Error:', err);
      alert('❌ Google Sign-in failed.');
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await login(form);
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      alert('✅ Login Successful!');
      navigate('/dashboard');
    } catch (error) {
      console.error('❌ Login error:', error);
      const msg = error?.response?.data?.message || 'Server error';
      alert('Login Failed: ' + msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="relative min-h-screen w-full bg-[#f5f6f8] dark:bg-[#0d0d0d] flex items-center justify-center px-6 py-20 overflow-hidden font-[Inter]">
        {/* Floating Icons */}
        {iconComponents.map((Icon, index) => {
          const top = Math.floor(Math.random() * 90);
          const left = Math.floor(Math.random() * 90);
          const size = Math.floor(Math.random() * 24) + 24;
          const opacity = Math.random() * 0.12 + 0.05;
          return (
            <motion.div
              key={index}
              className="absolute text-gray-300 dark:text-gray-600 select-none pointer-events-none"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity, scale: 1 }}
              transition={{ delay: index * 0.02, duration: 0.6 }}
              style={{ top: `${top}%`, left: `${left}%`, fontSize: `${size}px`, zIndex: 0 }}
            >
              <Icon />
            </motion.div>
          );
        })}

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 w-full max-w-2xl bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl px-12 py-14"
        >
          <h2 className="text-3xl font-extrabold text-center mb-6 text-gray-800 dark:text-white tracking-tight hover:text-indigo-500 transition-colors">
            🔐 Login to Your Account
          </h2>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                required
                className="w-full p-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#2a2a2a] text-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                required
                className="w-full p-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#2a2a2a] text-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition duration-300 shadow-md"
            >
              {loading ? 'Logging in...' : 'Login'}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="flex items-center justify-center my-4">
            <span className="text-gray-400 text-sm">or</span>
          </div>

          {/* Google Sign-In */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.02 }}
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 py-3 px-6 
                       border border-gray-300 dark:border-gray-700 
                       text-gray-800 dark:text-white 
                       bg-white dark:bg-[#2a2a2a] 
                       hover:bg-indigo-50 dark:hover:bg-indigo-600 
                       hover:text-indigo-700 dark:hover:text-white 
                       rounded-lg font-medium text-sm shadow transition-all duration-300"
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
              className="w-5 h-5"
            />
            Continue with Google
          </motion.button>

          {/* Bottom text */}
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-6 text-center">
            Don’t have an account?{' '}
            <a href="/register" className="text-indigo-500 hover:underline">
              Sign up
            </a>
          </p>
        </motion.div>
      </div>
    </AuthLayout>
  );
};

export default Login;
