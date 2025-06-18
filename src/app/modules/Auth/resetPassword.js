'use client'

import React, { useState } from 'react'

import axios from 'axios'
import Navbar from '@/app/components/navbar';



const backendurl = process.env.NEXT_PUBLIC_VITE_BACKEND_URL || 'http://localhost:4000';

const Resetpassword = () => {

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isotpsubmitted, setIsOtpSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendEmail = async (e) => {
    e.preventDefault();
    setLoading(true);   
       setError('');
      try {
        await axios.post(`${backendurl}/api/auth/send-reset-otp`, { email });
        setIsEmailSent(true);
      } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = (e) => {
    e.preventDefault();
    setIsOtpSubmitted(true);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
        try {
      await axios.post(`${backendurl}/api/auth/reset-password`, { email, otp, newPassword });
      setLoading(false);
      redirect('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
      setLoading(false);
    }
  };

  return (
    <>
    <Navbar />
    <div className="flex items-center justify-center min-h-screen bg-sky-200  ">
    
      {!isEmailSent && (
        <form className='bg-gray-100 p-8 rounded-lg shadow-lg w-96 text:sm' onSubmit={handleSendEmail}>
          <h1 className='text-sky-400 text-2xl font-semibold text-center mb-4'>Reset Password</h1>
          <p className='text-center mb-6 text-sky-400 '>Enter your registered email address</p>
          <div className='mb-4 flex items-center gap-3 w-full px-5 py-2.5 rounded-full bg-[#333A5C]'>
            <input type="email" placeholder='Email id' className='bg-transparent outline-none text-white'
              value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          {error && <div className='text-red-400 text-center mb-2'>{error}
            </div>}
          <button type='submit' className='w-full py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-900 text-white rounded-full mt-3' disabled={loading}>
            {loading ? 'Sending...' : 'Submit'}
          </button>
        </form>
      )}
      {!isotpsubmitted && isEmailSent && (
        <form className='bg-slate-900 p-8 rounded-lg shadow-lg w-96 text:sm' onSubmit={handleOtpSubmit}>
          <h1 className='text-white text-2xl font-semibold text-center mb-4'>Reset Password OTP</h1>
          <p className='text-center mb-6 text-indigo-300 '>Enter the 6-digit code sent to your email id</p>
          <input
            type='text'
            value={otp}
            onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className='w-full mb-4 px-4 py-2 rounded bg-gray-800 text-white outline-none text-center tracking-widest text-lg'
            placeholder='Enter OTP'
            maxLength={6}
            required
          />
          {error && <div className='text-red-400 text-center mb-2'>{error}</div>}
          <button
            type='submit'
            className='w-full py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all disabled:opacity-60'
            disabled={loading}
          >
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </form>
      )}

      {isotpsubmitted && isEmailSent && (
        <form className='bg-slate-900 p-8 rounded-lg shadow-lg w-96 text:sm' onSubmit={handleResetPassword}>
          <h1 className='text-white text-2xl font-semibold text-center mb-4'>New Password</h1>
          <p className='text-center mb-6 text-indigo-300 '>Enter the new password </p>
          <div className='mb-4 flex items-center gap-3 w-full px-5 py-2.5 rounded-full bg-[#333A5C]'>
            <input type="password" placeholder='New password' className='bg-transparent outline-none text-white'
              value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} />
          </div>
          {error && <div className='text-red-400 text-center mb-2'>{error}</div>}
          <button type='submit' className='w-full py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-900 text-white rounded-full mt-3' disabled={loading}>
            {loading ? 'Resetting...' : 'Submit'}
          </button>
        </form>
      )}
    </div>
    </>
  )
}

export default Resetpassword