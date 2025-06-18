'use client'
import React, { useState, useContext } from 'react'

import axios from 'axios'
import { toast } from 'react-toastify'
import { useEffect } from 'react'
import { AppContext } from '@/app/context/AppContext'

import { redirect } from 'next/navigation'
import Navbar from '@/app/components/navbar'

const Emailverify = () => {

  const { backendurl, userData, getuserData, isLoggedin } = useContext(AppContext);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }
    if (!userData?._id){
      toast.error('User data not found. Please try logging in again.');
      return;
    }
    console.log('Submitting verification with:', { otp, userData }); 
    setLoading(true); 
       try {
      const { data } = await axios.post(
        backendurl + '/api/auth/verify-account',
        { otp, userid: userData._id },
        { withCredentials: true }
      );
      if (data.success) {
        toast.success('Account verified successfully!');
        getuserData && getuserData();
       redirect('/');
      } else {
        toast.error(data.message || 'Verification failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(()=>{
    isLoggedin && userData && userData.isAccountVerified && redirect('/')
  },[isLoggedin,userData])

  return (
    <>
    <Navbar />
    <div className="flex items-center justify-center min-h-screen bg-sky-100">
         
     <form onSubmit={handleSubmit} className='bg-gray-100 p-8 rounded-lg shadow-lg w-96 text:sm'>
        <h1 className='text-sky-400 text-2xl font-semibold text-center mb-4'>Email Verify OTP</h1>
        <p className='text-center mb-6 text-sky-400 '>Enter the 6-digit code sent to your email id</p>
        <input
          type='text'
          value={otp}
          onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          className='w-full mb-4 px-4 py-2 rounded bg-sky-300 text-white outline-none text-center tracking-widest text-lg'
          placeholder='Enter OTP'
          maxLength={6}
        />
        <button
          type='submit'
          className='w-full py-2 rounded bg-sky-400 hover:bg-sky-600 text-white font-semibold transition-all disabled:opacity-60'
          disabled={loading}
        >
          {loading ? 'Verifying...' : 'Verify'}
        </button>
      </form>

    </div>
    </>
  )
}

export default Emailverify;