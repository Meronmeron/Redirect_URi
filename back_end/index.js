const express = require("express");
const querystring = require("querystring");
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const axios = require("axios");
const app = express();
const cors = require('cors');

const allowedOrigins = [
  'https://redirect-uri-tan.vercel.app', // Replace with your Vercel domain
  'http://localhost:3000', // Development origin
  'http://192.168.1.153:3000',
  'http://localhost:5173',
  'http://localhost:8000/login'
];

const corsOptions = {
  origin: (origin, callback) => {
    if (origin === null || origin === undefined || origin === '') {
      return callback(null, true);
    }

    const matchedOrigin = allowedOrigins.find(allowedOrigin => origin.startsWith(allowedOrigin));
    if (matchedOrigin) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
// Mock Redirect URI handler
// app.get('/auth/tiktok/callback', async (req, res) => {
//   const authorizationCode = req.query.code; // Get authorization code from query params
//   const clientId =  "aw0h2vs3s39ad7dk";
//   const clientSecret = "Gd5cLdFaAsv0pzQgidmWWkkeQHxoyBZt";
//   const redirectUri = 'https://redirect-uri-tan.vercel.app/redirect'; // Your Redirect URI

//   try {
//     // Exchange authorization code for access token
//     const tokenResponse = await axios.post('https://open-api.tiktok.com/oauth/access_token', {
//       client_key: clientId,
//       client_secret: clientSecret,
//       code: authorizationCode,
//       grant_type: 'authorization_code',
//       redirect_uri: redirectUri
//     });

//     const accessToken = tokenResponse.data.data.access_token;

//     // Redirect the user to the main app with the access token as a query parameter
//     res.redirect(`http://localhost:5173?token=${accessToken}`);

//   } catch (error) {
//     console.error('Error exchanging code for access token:', error.response?.data || error.message);
//     res.status(500).send('Authorization Failed');
//   }
// });

// // Start the server
// app.listen(3000, () => {
//   console.log('Server running on http://localhost:3000');
// });


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
  try {
      const csrfState = Math.random().toString(36).substring(2);
      res.cookie("csrfState", csrfState, { maxAge: 60000 });

      let url = "https://www.tiktok.com/v2/auth/authorize/";
      url += "?client_key=aw0h2vs3s39ad7dk";
      url += "&scope=user.info.basic,video.upload,video.publish";
      url += "&response_type=code";
      url += "&redirect_uri=https://redirect-uri-tan.vercel.app/redirect";
      url += "&state=" + csrfState;

      console.log(`[OAuth Request] URL generated: ${url}`);
      
      res.json({ url: url });
  } catch (error) {
      console.error(`[OAuth Error] An error occurred: ${error.message}`);
      res.status(500).json({ error: "Internal server error" });
  }
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
      res.json(response.data); 
      // res.redirect(`http://localhost:5173?token=${accessToken}`);

// Send JSON response back to the frontend
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
  
  // Call Python script for video processing
  const { spawn } = require('child_process');
  const process = spawn('python3', ['./process_video.py', videoPath, creativePath, sliderValue, horizontalValue, widthValue, heightValue, startTime, endTime, outputPath, animationDuration, animationType, width, height]);
  
  process.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });
    
  process.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });
    
  process.on('close', (code) => {
      console.log(`child process exited with code ${code}`)
      if (code === 0) {
          res.download(outputPath, 'edited_video.mp4');
      } else {
          res.status(500).json({ error: 'Failed to process video' });
      }
  });
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


app.listen(4000, ()=>{console.log("server is running on port 4000")})
  