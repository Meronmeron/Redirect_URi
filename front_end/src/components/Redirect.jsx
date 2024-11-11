import React, { useState, useEffect } from "react";
import axios from "axios";

const Redirect = () => {
  const [accessToken, setAccessToken] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0); // Progress bar state
  const [duration, setDuration] = useState(0);
  useEffect(() => {
    const urlSearchParams = new URLSearchParams(window.location.search);
    const code = urlSearchParams.get('code');
    const startTime = Date.now(); // Track the start time of the authorization

     // Simulate progress bar update interval
     const progressInterval = setInterval(() => {
      setProgress((prevProgress) => Math.min(prevProgress + 1, 99)); // Keep increasing until 99%
    }, 100);

    // Handle potential axios errors
    axios.post("https://back-end-latest.onrender.com/tiktokaccesstoken", {
      code,
    })
      .then((response) => {
        const endTime = Date.now(); // Track the end time when the response is received
        const parsedResponse = response.data;
        const timeTaken = endTime - startTime;
        setAccessToken(parsedResponse.access_token);
        setDuration(timeTaken); 
        setProgress(100);
        setIsLoading(false);
        // Redirect to localhost with the access token in the URL
         // Convert the parsed response to a JSON string and encode it
        const encodedResponse = encodeURIComponent(JSON.stringify(parsedResponse));
        const redirectUrl = `http://82.197.94.166:3000/platformAuth/?data=${encodedResponse}`;
        window.location.href = redirectUrl;
      })
      .catch((error) => {
        console.error("Error fetching access token:", error);
        setIsLoading(false);
      })
      .finally(() => {
        clearInterval(progressInterval); // Clear the interval once the request completes
      });

    return () => clearInterval(progressInterval); 
  }, []);

  return (
    <div className="bg-black text-white min-h-screen flex flex-col justify-center items-center">
      {isLoading ? (
       <>
          <p>Handling TikTok Authorization...</p>
          {/* Progress Bar */}
          <div className="w-full max-w-md bg-gray-300 h-2 rounded-full mt-4">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="mt-2 text-gray-400">
            Authorization in progress... Please wait.
          </p>
        </>
      ) : (
        <p>Redirecting to Dashboard...</p>
      )}
    </div>
  );
};

export default Redirect;
