import React, { useEffect, useState } from 'react';

const TikTokCreatorInfo = ({ accessToken }) => {
  const [creatorInfo, setCreatorInfo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCreatorInfo = async () => {
      console.log('infectch creator info',accessToken)
      const url = 'http://localhost:4000/api/creator_info';
      const headers = {
        'Authorization': `Bearer ${accessToken}`
      };

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: headers
        });
        const data = await response.json();
        console.log('Full API response:', data); 
        setCreatorInfo(data.data);
        console.log('Extracted creator info:', data.data); 
      } catch (error) {
        console.error('Error fetching creator info:', error);
        setError(error.message);
      }
    };

    fetchCreatorInfo();
  }, [accessToken]);

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!creatorInfo) {
    return <div>Loading...</div>;
  }

  return (
    <div className="bg-white text-black p-6 rounded-lg shadow-lg">
      <h1 className="text-2xl mb-4">Hello</h1>
      <p className="mb-4">{creatorInfo.creator_username}</p>
      <img src={creatorInfo.creator_avatar_url ? creatorInfo.creator_avatar_url : './profile.png'}
      alt={`${creatorInfo.creator_username || 'Placeholder'}'s avatar`}
      />
    </div>
  );
};

export default TikTokCreatorInfo;
