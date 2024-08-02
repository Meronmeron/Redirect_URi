import React, { useContext,useState, useRef, useEffect } from 'react';
import axios from 'axios';
import '../index.css'
import {toast,ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const EditorPage = ({accessToken}) => {
  
  const [outputFilePath, setOutputFilePath] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [creativeFile, setCreativeFile] = useState(null);
  const [videoElement, setVideoElement] = useState(null);
  const [creativeElement, setCreativeElement] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 640, height: 340 });
  const [animationType, setAnimationType] = useState('none');
  const [animationDuration, setAnimationDuration] = useState(1);
  const [horizontalValue, setHorizontalValue] = useState(50);
  const [positionValue, setPositionValue] = useState(50);
  const [widthValue, setWidthValue] = useState(640);
  const [heightValue, setHeightValue] = useState(360);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isOutputVisible, setIsOutputVisible] = useState(false);
  const canvasRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    drawPreview();
  }, [videoElement, creativeElement, animationType, animationDuration, horizontalValue, positionValue, widthValue, heightValue, startTime, endTime, dimensions]);

  const handleVideoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      video.loop = true;
      video.onloadeddata = () => {
        setVideoElement(video);
        setDimensions({ width: video.videoWidth, height: video.videoHeight });
        video.play();
        drawPreview()
      };
    }
  };

  const handleCreativeUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const creative = document.createElement(file.type.startsWith('video/') ? 'video' : 'img');
      creative.src = URL.createObjectURL(file);
      if (creative.tagName === 'VIDEO') {
        creative.onloadeddata = () => {
          creative.play();
          setCreativeElement(creative);
          drawPreview()
        };
      } else {
        creative.onload = () => {
          setCreativeElement(creative);
          drawPreview()
        };
      }
    }
  };

  const drawPreview = () => {
    if (!videoElement || !creativeElement) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    const x = (horizontalValue * (canvas.width - widthValue)) / 100;
    const y = (positionValue * (canvas.height - heightValue)) / 100;

    ctx.drawImage(creativeElement, x, y, widthValue, heightValue);
    requestAnimationFrame(drawPreview);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    const formData = new FormData(event.target);
    try {
      const response = await fetch('http://localhost:4000/api/upload/', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
     
      const blob = await response.blob();
      setLoading(false);
      const url = URL.createObjectURL(blob);
      console.log(url)
      videoRef.current.src = url;
      videoRef.current.controls = true;
      videoRef.current.style.display = 'visible';
      setIsOutputVisible(true)
      setOutputFilePath(url)
    } catch (error) {
      setLoading(false);
      console.error('Error:', error);
    }
  };

  const setVideoDimensions = (e) => {
    const [width, height] = e.target.value.split('x').map(Number);
    if (width && height) {
      const canvas = canvasRef.current;
      setDimensions({ width, height });
      canvas.width = width;
      canvas.height = height
    } else {
      console.error('Invalid dimensions:', e.target.value);
    }
  };
//http://localhost:3001 
//   const accessToken = "act.ZnvKhgbKHE2yfTfXL6bWnweXE0kbRDxdHHW0CuqCj1HITCXfOn2RtUWlikcI!4858.va"
  const handleVideoPost = async () => {
    try {
      console.log(accessToken)
      const file = new File([outputFilePath], 'editedVideo.mp4', { type: 'video/mp4' });
      const formData = new FormData();
      formData.append('video_file', file);
      const postResponse = await axios.post('http://localhost:4000/api/post', formData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      console.log(postResponse.data);
      if (postResponse.data.message === "Video uploaded successfully"){
          toast.success("Video uploaded successfully")
        }else{
            toast.error("failes to upload video")
        }
    } catch (error) {
      console.error('Error posting video:', error);
    }
  };
  

  return (
    <div className="container border border-black mx-auto mt-5 p-4 bg-white shadow rounded">
      <h1 className="text-2xl flex justify-center text-razzmatazz font-bold mb-4">Creative Studio</h1>
      <div className="grid grid-cols-2">
       <div> 
         <form className="" onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="video" className="block text-razzmatazz font-semibold mb-2">Upload Video</label>
            <input type="file" className="block w-full text-gray-700 border border-gray-300 rounded py-2 px-3 focus:outline-none   focus:border-razzmatazz" id="video" name="video" accept="video/*" onChange={handleVideoUpload} required />
          </div>
          <div className="mb-3">
            <label htmlFor="creative" className="block text-razzmatazz font-semibold mb-2">Upload Creative</label>
            <input type="file" className="block w-full text-gray-700 border border-gray-300 rounded py-2 px-3 focus:outline-none   focus:border-razzmatazz" id="creative" name="creative" accept="image/*,video/*" onChange={handleCreativeUpload} required />
          </div>
          <div className="mb-3">
            <label htmlFor="videoDimension" className="block text-razzmatazz font-semibold mb-2">Select Video Dimension</label>
            <select className="block w-full text-gray-700 border border-gray-300 rounded py-2 px-3 focus:outline-none focus:border-razzmatazz" id="videoDimension" name="video_dimension" onChange={setVideoDimensions}>
              <option value="640x340">640x340</option>
              <option value="406x720">406×720</option>
              <option value="720x1280">720x1280</option>
              <option value="854x480">854x480</option>
              <option value="1920x1080">1920x1080</option>
            </select>
          </div>
          <div className="mb-3">
            <label htmlFor="animationType" className="block text-razzmatazz font-semibold mb-2">Animation Type</label>
            <select className="block w-full text-gray-700 border border-gray-300 rounded py-2 px-3 focus:outline-none focus:border-razzmatazz" id="animationType" name="animation_type">
              <option value="none">None</option>
              <option value="fadein">Fade In</option>
              <option value="fadeout">Fade Out</option>
              <option value="slide">Slide</option>
            </select>
          </div>
          <div className="mb-3" id="animationDurationContainer">
            <label htmlFor="animationDuration" className="block text-razzmatazz font-semibold mb-2">Animation Duration (seconds)</label>
            <input type="number" className="block w-full text-gray-700 border border-gray-300 rounded py-2 px-3 focus:outline-none focus:border-razzmatazz" id="animationDuration" name="animation_duration" min="0" defaultValue="1" />
          </div>
          <div className="mb-3">
            <label htmlFor="horizontalSlider" className="block text-razzmatazz font-semibold mb-2">Adjust Horizontal Alignment</label>
            <input type="range" className="block w-full accent-black" min="0" max="100" defaultValue="50" id="horizontalSlider" name="horizontal_value" onChange={(e) => setHorizontalValue(e.target.value)} />
            <span id="horizontalValue" className="block text-gray-700 mt-2">{horizontalValue}</span>
          </div>
          <div className="mb-3">
            <label htmlFor="positionSlider" className="block text-razzmatazz font-semibold mb-2">Adjust Vertical Alignment</label>
            <input type="range" className="block w-full accent-black" min="0" max="100" defaultValue="50" id="positionSlider" name="position_value" onChange={(e) => setPositionValue(e.target.value)} />
            <span id="sliderValue" className="block text-gray-700 mt-2">{positionValue}</span>
          </div>
          <div className="mb-3">
            <label htmlFor="widthSlider" className="block text-razzmatazz font-semibold mb-2">Adjust Creative Width</label>
            <input type="range" className="block w-full accent-black" min="10" max="1920" defaultValue="640" id="widthSlider" name="width_value" onChange={(e) => setWidthValue(e.target.value)} />
            <span id="widthValue" className="block text-gray-700 mt-2">{widthValue}</span>
          </div>
          <div className="mb-3">
            <label htmlFor="heightSlider" className="block text-razzmatazz font-semibold mb-2">Adjust Creative Height</label>
            <input type="range" className="block w-full accent-black" min="10" max="1080" defaultValue="360" id="heightSlider" name="height_value" onChange={(e) => setHeightValue(e.target.value)} />
            <span id="heightValue" className="block text-gray-700 mt-2">{heightValue}</span>
          </div>
          <div className="mb-3">
            <label htmlFor="startTime" className="block text-razzmatazz font-semibold mb-2">Start Time (seconds)</label>
            <input type="number" className="block w-full text-gray-700 border border-gray-300 rounded py-2 px-3 focus:outline-none   focus:border-razzmatazz" id="startTime" name="start_time" min="0" defaultValue="0" onChange={(e) => setStartTime(e.target.value)} />
          </div>
          <div className="mb-3">
            <label htmlFor="endTime" className="block text-razzmatazz font-semibold mb-2">End Time (seconds)</label>
            <input type="number" className="block w-full text-gray-700 border border-gray-300 rounded py-2 px-3 focus:outline-none   focus:border-razzmatazz" id="endTime" name="end_time" min="0" onChange={(e) => setEndTime(e.target.value)} />
          </div>
          <button type="submit" className="bg-razzmatazz text-white py-2 px-4 rounded-lg shadow-lg hover:bg-splash transition-colors">Edit</button>
          {loading && <div className="loading text-blue-500 font-semibold mt-2">Loading...</div>}
          <div className={`mt-4 ${isOutputVisible ? '' : 'hidden'}`}>
            <h2 className="text-xl font-bold mb-2">Output Video</h2>
            <video ref={videoRef} style={{ display: 'visible' }} controls></video>
            
          </div>
          
        </form>
        {isOutputVisible && <button className="bg-razzmatazz mt-2 text-white py-2 px-4 rounded-lg shadow-lg hover:bg-splash transition-colors"
              onClick={() => handleVideoPost()}>
              Post Content
          </button>}
        </div>
        <div className=" mt-8 ml-4 pl-4 ">
        <canvas id='previewCanvas' ref={canvasRef} className="border border-gray-300 rounded"></canvas>
       </div>
      </div>
      <ToastContainer/>
    </div>

  );
};

export default EditorPage;
