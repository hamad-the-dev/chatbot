'use client';
import Navbar from '@/app/components/navbar';
import { AppContext } from '@/app/context/AppContext';

import { redirect } from 'next/navigation';
import React, { useContext, useEffect, useState } from 'react';
import { IoIosArrowRoundForward } from "react-icons/io";



const Main = () => {
    const [animate, setAnimate] = useState(false);
    const { userData } = useContext(AppContext);


    useEffect(() => {
        setAnimate(true);
    }, []);

    return (
        <>
         <Navbar />
        
        <div className='min-h-screen bg-sky-200 flex flex-col justify-center items-center px-4 text-center text-gray-800'>
            <img
                src="./images/header_img.png"
                alt="header"
                className={`w-36 h-36 rounded-full mb-6 ${animate ? 'float-down' : ''}`}
                style={{
                    transform: animate ? 'translateY(0)' : 'translateY(-100px)',
                    opacity: animate ? 1 : 0,
                    transition: 'transform 1s ease-out, opacity 1s ease-out',
                }}
            />
            <h1 className='text-xl sm:text-3xl font-medium mb-2'>
                Hey <span className='text-sky-500'>{userData ? userData.name : 'Developer'}!</span>
            </h1>
            <h2 className='text-3xl sm:text-5xl font-semibold mb-4 text-white'>Welcome to <span className='text-sky-400'>our App</span></h2>
            <p className='text-white'>Let's start with a quick product tour and you'll be up and running in no time.</p>  
                <button
                className='border flex items-center gap-2 border-white hover:text-white hover:border-sky-600 rounded-full px-8 py-2.5 mt-10 cursor-pointer hover:bg-sky-400 transition-all'
                onClick={() => userData ? redirect('/chat') : redirect('/login')}
            >
                Get Started
                <IoIosArrowRoundForward className='text-xl' />
            </button>
        </div>
        </>
    );
};

export default Main;
