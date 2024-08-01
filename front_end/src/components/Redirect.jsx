import React, { useState, useEffect } from "react";
import axios from "axios";
import TikTokCreatorInfo from './TiktokCreatorInfo';
// import EditorPage from './EditorPage';
// import { Link } from 'react-router-dom';

const Redirect = () => {
  const [responseData, setResponseData] = useState(null);
  const [accessToken, setAccessToken] = useState('');
  const [isLoading, setIsLoading] = useState(true); // Track loading state

  useEffect(() => {
    const urlSearchParams = new URLSearchParams(window.location.search);
    const code = urlSearchParams.get('code');

    // Handle potential axios errors
    axios.post("http://localhost:4000/tiktokaccesstoken", {
      code,
    })
    .then((response) => {
        const parsedResponse = response.data; // Assuming JSON response
        setResponseData(parsedResponse);
        setAccessToken(parsedResponse.access_token);
        console.log(parsedResponse.access_token);
        setIsLoading(false); // Set loading to false on successful response
      })
      .catch((error) => {
        console.error("Error fetching access token:", error);
        setIsLoading(false); // Set loading to false on error
      });
  }, []);

  return (
    <div className="bg-black text-white min-h-screen flex flex-col justify-center items-center">
      {responseData ? (
        <div className="text-center">
          <h3 className="text-3xl mb-4">Welcome</h3>
          <TikTokCreatorInfo accessToken={accessToken}/>
          
          <button className="bg-razzmatazz text-white mt-2 py-2 px-4 rounded-lg shadow-lg hover:bg-splash transition-colors">Create</button>
        </div>
        ) : (
        <p>Handling TikTok Authorization...</p>
      )}
    </div>
  );
};

export default Redirect;
