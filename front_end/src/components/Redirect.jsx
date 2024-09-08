import React, { useState, useEffect } from "react";
import axios from "axios";

const Redirect = () => {
  const [accessToken, setAccessToken] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const urlSearchParams = new URLSearchParams(window.location.search);
    const code = urlSearchParams.get('code');

    // Handle potential axios errors
    axios.post("https://back-end-latest.onrender.com/tiktokaccesstoken", {
      code,
    })
      .then((response) => {
        const parsedResponse = response.data;
        setAccessToken(parsedResponse.access_token);
        setIsLoading(false);

        // Redirect to localhost with the access token in the URL
        const redirectUrl = ` http://localhost:5173?access_token=${parsedResponse.access_token}`;
        window.location.href = redirectUrl;
      })
      .catch((error) => {
        console.error("Error fetching access token:", error);
        setIsLoading(false);
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
