'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
// import { Loader } from 'rizzui';
import { BiImageAdd } from "react-icons/bi";



const UploadProfilePicture= () => {
  const [preview, setPreview] = useState();
  const onDrop = useCallback(
    async (acceptedFiles) => {
      if ( acceptedFiles.length === 0) return;
  
      const image = acceptedFiles[0];
      const formData = new FormData();
      formData.append('images', image);
  
      setPreview(URL.createObjectURL(image));
  
    //   try {
    //     const response = await uploadProfilePicture(formData);
    //     if (response?.data?.thumbnailUrl) {
    //       dispatch(setUserData({ ...user, thumbnailUrl: response.data.thumbnailUrl }));
    //     }
    //   } catch (error) {
    //     console.error('Error uploading profile picture:', error);
    //   }
    },
    [ ]
  );
  

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
  });


  return (
    <div
    {...getRootProps()}
    className={`w-12 h-12 rounded-full border text-center cursor-pointer relative group flex items-center justify-center ${
      isDragActive ? 'border-blue-500' : 'border-gray-300'
    }`}
  >
    <input {...getInputProps()} />
    {preview ? (
      <div className="relative">
        <img
          src={preview}
          alt="Profile Picture"
          className="w-12 h-12 rounded-full object-cover mx-auto"
        />
        {/* {showUploadOnHover && (
          <div className="absolute inset-0 rounded-full bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className='flex flex-col items-center justify-center'>
              <BiImageAdd size={25} className='text-white' />
              <p className="text-white text-sm">Update Profile</p>
            </div>
          </div>
        )} */}
        {/* {loading && <Loader variant="spinner" size='xl' className='absolute top-12 left-10' />} */}
      </div>
    ) : (
      <div className="flex flex-col justify-center items-center">
        <BiImageAdd size={40} className="text-gray-400" />
        {/* <p className="text-sm text-gray-500 mt-2">Upload Profile</p> */}
      </div>
    )}
  </div>
  
  );
};

export default UploadProfilePicture;