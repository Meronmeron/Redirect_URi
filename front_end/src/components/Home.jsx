import React from "react";
import axios from "axios";

const Home = () => {
  const request_token = async () => {
    const response = await axios.get("https://redirect-uri-u98q.onrender.com/oauth");
    window.location.href = `${response.data.url}`;
  };
return (
    <div className="bg-black text-white min-h-screen flex flex-col justify-center items-center">
      <div className="text-center">
        <button className="bg-razzmatazz text-white mt-2 py-2 px-4 rounded-lg shadow-lg hover:bg-splash transition-colors" onClick={request_token}>Tik tok</button>
      </div>
    </div>
  );
};
export default Home;