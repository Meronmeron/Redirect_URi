import React, { useState, useEffect } from "react";
import axios from "axios";

const Redirect = () => {
  const [accessToken, setAccessToken] = useState('');
  const [isLoading, setIsLoading] = useState(true); // Track loading state

  useEffect(() => {
    const urlSearchParams = new URLSearchParams(window.location.search);
    const code = urlSearchParams.get('code');

    // Handle potential axios errors
    axios.post("https://back-end-latest.onrender.com/tiktokaccesstoken", {
      code,
    })
      .then((response) => {
        const parsedResponse = response.data; // Assuming JSON response
        setAccessToken(parsedResponse.access_token);
        console.log(parsedResponse.access_token);
        localStorage.setItem('TiktokToken', parsedResponse.access_token);
        setIsLoading(false); // Set loading to false on successful response

        // Redirect to dashboard after setting token
        window.location.href = 'http://localhost:8000/dashboard';
      })
      .catch((error) => {
        console.error("Error fetching access token:", error);
        setIsLoading(false); // Set loading to false on error
      });
  }, []);

  return (
    <div className="bg-black text-white min-h-screen flex flex-col justify-center items-center">
      {isLoading ? (
        <p>Handling TikTok Authorization...</p>
      ) : (
        <p>Redirecting to Dashboard...</p>
      )}
    </div>
  );
};

export default Redirect;
