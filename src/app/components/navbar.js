import React, { useContext } from "react";
import axios from "axios"; 
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { AppContext } from "@/app/context/AppContext";

const Navbar = () => {
  const router = useRouter();
  const { userData, setUserData, setIsLoggedin, backendurl } =
    useContext(AppContext); 
     const sendverificationotp = async () => {
    try {
      console.log('Sending verification OTP for:', userData); 
      if (!userData?._id || !userData?.email) {
        toast.error('User data not found. Please try logging in again.');
        return;
      }
      axios.defaults.withCredentials = true;
      const { data } = await axios.post(
        backendurl + "/api/auth/send-verify-otp",
        { email: userData.email, userid: userData._id }
      );

      if (data.success) {
        toast.success("Verification OTP sent to your email");
        router.push("/email-verify");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const logout = async () => {
    try {
      axios.defaults.withCredentials = true;

      const { data } = await axios.post(backendurl + "/api/auth/logout");
      if (data.success) {
        setIsLoggedin(false);
        setUserData(false);
        router.push("/");
      }
    } catch (error) {
      toast.error(error.message);
    }
  };
  return (
    <div className="w-full flex justify-between items-center py-2 pl-5 pr-12 ">
      <div>
       <img
        src='./images/logo1.png'
        alt="logo"
        className="w-44 h-auto cursor-pointer"
        onClick={() => router.push("/")}
      />
      </div> 
      {userData ? (
        <div className="w-8 h-8 justify-center items-center flex rounded-full bg-sky-400 text-gray-100 font-semibold relative group">
          {userData.name[0].toUpperCase()}   
                 <div className="absolute hidden group-hover:block top-0 right -0 z-10 text-black rounded pt-10">
            <ul className="list-none m-0 p-2 bg-gray-100 text-sm">
              {!userData.isAccountVerified && (
                <li
                  onClick={sendverificationotp}
                  className="py-1 px-2 hover:bg-gray-200 cursor-pointer"
                >
                  VerifyAccount
                </li>
              )}
              <li
                onClick={logout}
                className="py-1 px-2 hover:bg-gray-200 cursor-pointer pr-10"
              >
                Logout
              </li>
            </ul>
          </div>
        </div>
      ) : (
        <button
          onClick={() => router.push("/login")}
          className="flex items-center gap-2 border border-gray-50 rounded-full px-6 py-2 text-white cursor-pointer bg-sky-400 transition-all"
        >
          Login

        </button>
      )}
    </div>
  );
};

export default Navbar;