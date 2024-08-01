const express = require("express");
const querystring = require("querystring");
const cors = require("cors");
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const axios = require("axios");
const app = express();
app.use(cors());
// const allowedOrigins = ['http://localhost:3000', 'https://redirect-uri-tan.vercel.app'];
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl requests, etc.)
    if (!origin) return callback(null, true);
    
    // Check if the origin starts with the allowed prefixes
    if (origin.startsWith('http://localhost:3000') || origin.startsWith('https://redirect-uri-tan.vercel.app')) {
      callback(null, true); // Allow the origin
    } else {
      callback(new Error('Not allowed by CORS')); // Block the origin
    }
  }
};

// Use the CORS middleware with the custom options
app.use(cors(corsOptions));
// app.use(cors({ origin: allowedOrigins }))
const UPLOAD_FOLDER = 'uploads';

const upload = multer({ dest: UPLOAD_FOLDER });

if (!fs.existsSync(UPLOAD_FOLDER)) {
    fs.mkdirSync(UPLOAD_FOLDER);
}

app.use(express.json());
const session = require("express-session");
const cookieParser = require("cookie-parser");
app.use(cookieParser());


app.get("/oauth", (req, res) => {
    const csrfState = Math.random().toString(36).substring(2);
    res.cookie("csrfState", csrfState, { maxAge: 60000 });
      let url = "https://www.tiktok.com/v2/auth/authorize/";
      // the following params need to be in `application/x-www-form-urlencoded` format.
      url += "?client_key=aw0h2vs3s39ad7dk";
      url += "&scope=user.info.basic,video.upload,video.publish";
      url += "&response_type=code";
      url +=
      "&redirect_uri=https://redirect-uri-tan.vercel.app/redirect";
      url += "&state=" + csrfState;
    res.json({ url: url });
  });

  app.post("/tiktokaccesstoken", async (req, res) => {
    try {
      const { code } = req.body;
      const decode = decodeURI(code);
      const tokenEndpoint = "https://open.tiktokapis.com/v2/oauth/token/";
      const params = {
        client_key: "aw0h2vs3s39ad7dk",
        client_secret: "Gd5cLdFaAsv0pzQgidmWWkkeQHxoyBZt",
        code: decode,
        grant_type: "authorization_code",
        redirect_uri: "https://redirect-uri-tan.vercel.app/redirect",
      };
  
      const response = await axios.post(
        tokenEndpoint,
        querystring.stringify(params),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Cache-Control": "no-cache",
          },
        }
      );
  
      // Log and send the response data back to the frontend
      console.log("response>>>>>>>", response.data);
      res.json(response.data); // Send JSON response back to the frontend
    } catch (error) {
      console.error("Error during callback:", error.message);
      res.status(500).json({ error: "An error occurred during the login process." });
    }
  });
  app.post('/api/creator_info', async (req, res) => {
    const url = 'https://open.tiktokapis.com/v2/post/publish/creator_info/query/';
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(400).json({ error: 'Authorization header is missing' });
    }

    try {
        const response = await axios.post(url, {}, {
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json; charset=UTF-8'
            }
        });
        res.json(response.data);
    } catch (error) {
        res.status(error.response.status || 500).json({ error: error.message });
    }
});

app.post('/api/upload', upload.fields([{ name: 'video' }, { name: 'creative' }]), (req, res) => {
  const videoFile = req.files.video[0];
  const creativeFile = req.files.creative[0];
  const sliderValue = parseInt(req.body.position_value);
  const horizontalValue = parseInt(req.body.horizontal_value);
  const widthValue = parseInt(req.body.width_value);
  const heightValue = parseInt(req.body.height_value);
  const startTime = parseFloat(req.body.start_time || 0);
  const endTime = parseFloat(req.body.end_time || 0);
  const videoDimension = req.body.video_dimension;
  const animationType = req.body.animation_type || 'none';
  const animationDuration = parseFloat(req.body.animation_duration);

  const videoPath = path.join(UPLOAD_FOLDER, videoFile.filename);
  const creativePath = path.join(UPLOAD_FOLDER, creativeFile.filename);
  const outputPath = path.join(UPLOAD_FOLDER, 'output.mp4');

  const width = parseInt(videoDimension.split('x')[0]);
  const height = parseInt(videoDimension.split('x')[1]);
  
  const ffmpeg = require('fluent-ffmpeg');
  const ffmpegPath = require('ffmpeg-static');
  
  ffmpeg.setFfmpegPath(ffmpegPath);
  
  processVideo({
    videoPath: videoFile,
    creativePath: creativeFile,
    sliderValue: sliderValue,
    horizontalValue: horizontalValue,
    widthValue: widthValue,
    heightValue: heightValue,
    startTime: startTime,
    endTime: endTime,
    outputPath: outputPath,
    animationDuration: animationDuration,
    animationType: animationType,
    width: width,
    height: height
});

  function processVideo({
      videoPath,
      creativePath,
      sliderValue,
      horizontalValue,
      widthValue,
      heightValue,
      startTime,
      endTime,
      outputPath,
      animationDuration,
      animationType,
      width,
      height
  }) {
      // Convert slider and horizontal values to percentage
      const y = (sliderValue / 100) * (height - heightValue);
      const x = (horizontalValue / 100) * (width - widthValue);
  
      // Define filters for creative
      let filters = [];
      filters.push(`scale=${widthValue}:${heightValue}`);
  
      if (animationType === 'fadein') {
          filters.push(`fade=t=in:st=${startTime}:d=${animationDuration}`);
      } else if (animationType === 'fadeout') {
          filters.push(`fade=t=out:st=${endTime - animationDuration}:d=${animationDuration}`);
      } else if (animationType === 'slide') {
          filters.push(`setpts=PTS-STARTPTS+${startTime}/TB`);
          filters.push(`crop=${width}:${height}:${x}:${y}`);
      }
  
      ffmpeg()
          .input(videoPath)
          .input(creativePath)
          .complexFilter([
              {
                  filter: 'scale',
                  options: { w: width, h: height }
              },
              {
                  filter: 'overlay',
                  options: {
                      x: x,
                      y: y,
                      enable: `between(t,${startTime},${endTime || 'main_duration'})`
                  }
              }
          ])
          .output(outputPath)
          .on('end', () => {
              console.log('Processing finished successfully');
          })
          .on('error', (err) => {
              console.error('An error occurred:', err);
          })
          .run();
  }
  
  // Example usage
 
  // Call Python script for video processing
  // const { spawn } = require('child_process');
  // const process = spawn('python3', ['./process_video.py', videoPath, creativePath, sliderValue, horizontalValue, widthValue, heightValue, startTime, endTime, outputPath, animationDuration, animationType, width, height]);
  
  // process.stdout.on('data', (data) => {
  //     console.log(`stdout: ${data}`);
  //   });
    
  // process.stderr.on('data', (data) => {
  //     console.error(`stderr: ${data}`);
  //   });
    
  // process.on('close', (code) => {
  //     console.log(`child process exited with code ${code}`)
  //     if (code === 0) {
  //         res.download(outputPath, 'edited_video.mp4');
  //     } else {
  //         res.status(500).json({ error: 'Failed to process video' });
  //     }
  // });
});

app.post('/api/post', upload.single('video_file'), async (req, res) => {
  const videoFile = req.file;
  const outputPath = path.join(UPLOAD_FOLDER, videoFile.filename);

  const accessToken = req.headers.authorization;
  if (!accessToken) {
      return res.status(400).json({ error: 'No access token provided' });
  }

  try {
      const videoSize = fs.statSync(outputPath).size;
      const minChunkSize = 5 * 1024 * 1024; // 5 MB
      const chunkSize = Math.min(minChunkSize, videoSize);
      const totalChunkCount = Math.ceil(videoSize / chunkSize);

      const uploadInitUrl = "https://open.tiktokapis.com/v2/post/publish/inbox/video/init/";

      const initResponse = await axios.post(uploadInitUrl, {
          source_info: {
              source: "FILE_UPLOAD",
              video_size: videoSize,
              chunk_size: chunkSize,
              total_chunk_count: totalChunkCount
          }
      }, {
          headers: {
              'Authorization': accessToken
          }
      });

      if (initResponse.status === 200) {
          const uploadUrl = initResponse.data.data.upload_url;

          const videoStream = fs.createReadStream(outputPath, { highWaterMark: chunkSize });
          let chunkIndex = 0;

          for await (const chunk of videoStream) {
              const startByte = chunkIndex * chunkSize;
              const endByte = startByte + chunk.length - 1;
              const contentRange = `bytes ${startByte}-${endByte}/${videoSize}`;

              const chunkResponse = await axios.put(uploadUrl, chunk, {
                  headers: {
                      'Content-Range': contentRange,
                      'Content-Length': chunk.length.toString(),
                      'Content-Type': 'video/mp4'
                  }
              });

              if (![200, 201, 202].includes(chunkResponse.status)) {
                  throw new Error(`Failed to upload chunk ${chunkIndex + 1}`);
              }

              chunkIndex++;
          }

          fs.unlinkSync(outputPath);
          res.json({ message: 'Video uploaded successfully' });
      } else {
          throw new Error('Failed to initialize video upload');
      }
  } catch (error) {
      res.status(error.response.status || 500).json({ error: error.message });
  }
});

// window.location.href = `http://localhost:3000/redirect/?response=${encodeURIComponent(JSON.stringify(responseData))}`; 
// res.redirect(`http://localhost:3000/redirect/?response=${encodeURIComponent(JSON.stringify(responseData))}`);


// const REDIRECT_URI = 'https://redirect-uri-tan.vercel.app/redirect';
// const PORT = 4000
// app.get('/oauth/callback', (req, res) => {
//     const csrfState = Math.random().toString(36).substring(2);
//     res.cookie("csrfState", csrfState, { maxAge: 60000 });

//     const authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=aw0h2vs3s39ad7dk&scope=user.info.basic,video.upload,video.publish&response_type=code&redirect_uri='https://redirect-uri-tan.vercel.app/redirect'&state=${csrfState}`;
    

//     res.redirect(authUrl);  // Redirect the user to the TikTok authorization page
// });

// app.get('/oauth/redirect', async (req, res) => {
//     const authorizationCode = req.query.code;

//     if (!authorizationCode) {
//         return res.redirect(`http://localhost:3000/redirect/?response=${encodeURIComponent(JSON.stringify({ error: 'Authorization code not found in the URL.' }))}`);
//     }

//     try {
//         const response = await axios.post('https://open.tiktokapis.com/v2/oauth/token/', new URLSearchParams({
//             client_key: 'aw0h2vs3s39ad7dk',
//             client_secret: 'Gd5cLdFaAsv0pzQgidmWWkkeQHxoyBZt',
//             code: authorizationCode,
//             grant_type: 'authorization_code',
//             redirect_uri: REDIRECT_URI,
//         }).toString(), {
//             headers: {
//                 'Content-Type': 'application/x-www-form-urlencoded',
//             },
//         },{timeout:1000});

//         const responseData = response.data;

//         // Redirect to React app with the response data
//         res.redirect(`http://localhost:3000/redirect/?response=${encodeURIComponent(JSON.stringify(responseData))}`);
//     } catch (error) {
//         console.error('Error during token exchange:', error);
//         const responseData = { error: 'Failed to exchange token' };
//         res.redirect(`http://localhost:3000/redirect/?response=${encodeURIComponent(JSON.stringify(responseData))}`);
//     }
// });
// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });





 // Constants
// const CLIENT_KEY = 'YOUR_CLIENT_KEY';
// const CLIENT_SECRET = 'YOUR_CLIENT_SECRET';
// const REDIRECT_URI = 'YOUR_REDIRECT_URI';

// // Get the authorization code from the URL
// const urlParams = new URLSearchParams(window.location.search);
// const authorizationCode = urlParams.get('code');

// (async () => {
//     let responseData;

//     if (authorizationCode) {
//         // Prepare the POST request data
//         const postData = new URLSearchParams({
//             client_key: CLIENT_KEY,
//             client_secret: CLIENT_SECRET,
//             code: authorizationCode,
//             grant_type: 'authorization_code',
//             redirect_uri: REDIRECT_URI,
//         });

//         try {
//             // Make the POST request using fetch
//             const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/x-www-form-urlencoded',
//                 },
//                 body: postData.toString(),
//             });

//             if (!response.ok) {
//                 throw new Error(`HTTP error! status: ${response.status}`);
//             }

//             // Decode the JSON response
//             responseData = await response.json();
//         } catch (error) {
//             // Handle fetch errors
//             responseData = {
//                 error: 'Fetch error: ' + error.message,
//             };
//         }
//     } else {
//         // Handle case where authorization code is not found
//         responseData = {
//             error: 'Authorization code not found in the URL.',
//         };
//     }

//     // Redirect back to React app with response JSON
//     window.location.href = `http://localhost:3000/redirect/?response=${encodeURIComponent(JSON.stringify(responseData))}`;
// })();

app.listen(4000, ()=>{console.log("server is running on port 4000")})
  