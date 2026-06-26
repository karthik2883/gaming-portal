import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Helper to encode strings as percentage-encoded for OAuth
function percentEncode(str: string): string {
  return encodeURIComponent(str)
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A');
}

// HMAC-SHA1 signature generator for OAuth 1.0a
function generateOAuthSignature(
  method: string,
  url: string,
  oauthParams: Record<string, string>,
  queryParams: Record<string, string>,
  bodyParams: Record<string, string>,
  consumerSecret: string,
  tokenSecret?: string
): string {
  const allParams = { ...oauthParams, ...queryParams, ...bodyParams };
  
  // Sort parameters alphabetically
  const sortedKeys = Object.keys(allParams).sort();
  const paramString = sortedKeys
    .map(key => `${percentEncode(key)}=${percentEncode(allParams[key].toString())}`)
    .join('&');

  const baseString = [
    method.toUpperCase(),
    percentEncode(url),
    percentEncode(paramString)
  ].join('&');

  const signingKey = [
    percentEncode(consumerSecret),
    percentEncode(tokenSecret || '')
  ].join('&');

  return crypto
    .createHmac('sha1', signingKey)
    .update(baseString)
    .digest('base64');
}

// Helper to generate OAuth 1.0a header
function getOAuthHeader(method: string, url: string, queryParams: Record<string, string> = {}, bodyParams: Record<string, string> = {}): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: process.env.X_API_KEY || '',
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: process.env.X_ACCESS_TOKEN || '',
    oauth_version: '1.0'
  };

  const signature = generateOAuthSignature(
    method,
    url,
    oauthParams,
    queryParams,
    bodyParams,
    process.env.X_API_SECRET || '',
    process.env.X_ACCESS_SECRET || ''
  );

  oauthParams.oauth_signature = signature;

  const headerParts = Object.keys(oauthParams)
    .sort()
    .map(key => `${percentEncode(key)}="${percentEncode(oauthParams[key as keyof typeof oauthParams])}"`);

  return `OAuth ${headerParts.join(', ')}`;
}

// 1. Video Recording using Puppeteer
async function recordGameplay(gameSlug: string, outputPath: string): Promise<boolean> {
  const { default: puppeteer } = await import('puppeteer');
  console.log(`\n--- Recording Gameplay for Game: ${gameSlug} ---`);
  
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 800, height: 600 });

  const gameUrl = `https://www.fliptripgames.com/game/${gameSlug}`;
  console.log(`Navigating to: ${gameUrl}`);
  await page.goto(gameUrl, { waitUntil: 'networkidle2' });

  console.log('Waiting for game to initialize (8 seconds)...');
  await new Promise(resolve => setTimeout(resolve, 8000));

  // Focus and select levels for games
  console.log('Clicking canvas to focus and select level...');
  await page.mouse.click(400, 300); // Center click
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  if (gameSlug === 'candy-match') {
    await page.mouse.click(200, 200); // Level 1 button
    await new Promise(resolve => setTimeout(resolve, 2500)); // Wait for grid entrance animation
  } else if (gameSlug === 'football-strike' || gameSlug === 'football') {
    await page.mouse.click(400, 480); // Click select country
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.mouse.click(400, 480); // Click start match
    await new Promise(resolve => setTimeout(resolve, 2500)); // Wait for field fade-in
  } else if (gameSlug === 'bubble-shooter') {
    // Click play button on home screen of bubble shooter
    await page.mouse.click(240, 450); // Click play button
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for board to slide down
  } else if (gameSlug === 'typing' || gameSlug === 'type-racer' || gameSlug === 'neon-velocity') {
    // Select mode
    await page.mouse.click(400, 350); 
    await new Promise(resolve => setTimeout(resolve, 1500));
  } else if (gameSlug === 'tetris' || gameSlug === 'sudoku' || gameSlug === 'pacman') {
    // Press center to start game
    await page.mouse.click(400, 350);
    await new Promise(resolve => setTimeout(resolve, 1500));
  } else {
    // Generic default start sequence
    await page.mouse.click(400, 300);
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  console.log('Starting MediaRecorder on Canvas...');
  await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) throw new Error('Canvas not found!');

    const stream = (canvas as any).captureStream(30); // 30 FPS
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
    (window as any).chunks = [];
    (window as any).recorder = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        (window as any).chunks.push(e.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob((window as any).chunks, { type: 'video/webm' });
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        (window as any).videoBase64 = reader.result;
      };
    };

    recorder.start();
  });

  console.log('Recording 25 seconds of simulated inputs...');
  const duration = 25; // 25 seconds
  const steps = 25;
  for (let i = 0; i < steps; i++) {
    if (gameSlug === 'candy-match') {
      const col1 = Math.floor(Math.random() * 8);
      const row1 = Math.floor(Math.random() * 8);
      let col2 = col1, row2 = row1;
      if (Math.random() > 0.5) col2 = Math.min(7, col1 + 1);
      else row2 = Math.min(7, row1 + 1);

      await page.mouse.click(275 + col1 * 60 + 30, 90 + row1 * 60 + 30);
      await new Promise(resolve => setTimeout(resolve, 200));
      await page.mouse.click(275 + col2 * 60 + 30, 90 + row2 * 60 + 30);
    } else if (gameSlug === 'bubble-shooter') {
      const shootX = 100 + Math.floor(Math.random() * 280);
      const shootY = 100 + Math.floor(Math.random() * 200);
      await page.mouse.click(shootX, shootY);
    } else {
      const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
      const randomKey = keys[Math.floor(Math.random() * keys.length)];
      await page.keyboard.press(randomKey as any);
    }
    await new Promise(resolve => setTimeout(resolve, (duration * 1000) / steps));
  }

  console.log('Stopping recording...');
  await page.evaluate(() => {
    if ((window as any).recorder && (window as any).recorder.state !== 'inactive') {
      (window as any).recorder.stop();
    }
  });

  let videoBase64 = null;
  for (let i = 0; i < 20; i++) {
    videoBase64 = await page.evaluate(() => (window as any).videoBase64);
    if (videoBase64) break;
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  await browser.close();

  if (videoBase64) {
    const base64Data = videoBase64.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(outputPath, buffer);
    console.log(`Video created successfully: ${outputPath}`);
    return true;
  } else {
    console.error('Failed to create video.');
    return false;
  }
}

// 2. Post to X (Twitter)
async function postToX(videoPath: string, caption: string): Promise<string> {
  if (!process.env.X_API_KEY || !process.env.X_ACCESS_TOKEN) {
    throw new Error('Missing X API credentials in environment variables.');
  }

  const uploadUrl = 'https://upload.twitter.com/1.1/media/upload.json';
  const videoBuffer = fs.readFileSync(videoPath);
  const totalBytes = videoBuffer.length;

  console.log('X Media Upload: INIT...');
  const initParams = {
    command: 'INIT',
    total_bytes: totalBytes.toString(),
    media_type: 'video/mp4',
    media_category: 'tweet_video'
  };
  const initHeader = getOAuthHeader('POST', uploadUrl, {}, initParams);

  const initFormData = new FormData();
  Object.keys(initParams).forEach(k => initFormData.append(k, initParams[k as keyof typeof initParams]));

  const initRes = await fetch(uploadUrl, {
    method: 'POST',
    headers: { Authorization: initHeader },
    body: initFormData
  });

  const initData = await initRes.json() as any;
  if (!initRes.ok || !initData.media_id_string) {
    throw new Error(`X Media INIT failed: ${JSON.stringify(initData)}`);
  }

  const mediaId = initData.media_id_string;
  console.log(`Media ID initialized: ${mediaId}`);

  const segmentSize = 1024 * 1024;
  let segmentIndex = 0;
  for (let offset = 0; offset < totalBytes; offset += segmentSize) {
    const chunk = videoBuffer.subarray(offset, Math.min(offset + segmentSize, totalBytes));
    console.log(`X Media Upload: APPEND segment ${segmentIndex}...`);

    const appendParams = {
      command: 'APPEND',
      media_id: mediaId,
      segment_index: segmentIndex.toString()
    };
    const appendHeader = getOAuthHeader('POST', uploadUrl, {}, appendParams);

    const appendFormData = new FormData();
    Object.keys(appendParams).forEach(k => appendFormData.append(k, appendParams[k as keyof typeof appendParams]));
    appendFormData.append('media', new Blob([chunk]), 'segment.mp4');

    const appendRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: { Authorization: appendHeader },
      body: appendFormData
    });

    if (!appendRes.ok) {
      const errText = await appendRes.text();
      throw new Error(`X Media APPEND failed for segment ${segmentIndex}: ${errText}`);
    }
    segmentIndex++;
  }

  console.log('X Media Upload: FINALIZE...');
  const finalizeParams = {
    command: 'FINALIZE',
    media_id: mediaId
  };
  const finalizeHeader = getOAuthHeader('POST', uploadUrl, {}, finalizeParams);

  const finalizeFormData = new FormData();
  Object.keys(finalizeParams).forEach(k => finalizeFormData.append(k, finalizeParams[k as keyof typeof finalizeParams]));

  const finalizeRes = await fetch(uploadUrl, {
    method: 'POST',
    headers: { Authorization: finalizeHeader },
    body: finalizeFormData
  });

  const finalizeData = await finalizeRes.json() as any;
  if (!finalizeRes.ok) {
    throw new Error(`X Media FINALIZE failed: ${JSON.stringify(finalizeData)}`);
  }

  if (finalizeData.processing_info) {
    console.log('Waiting for Twitter to process the video...');
    let state = finalizeData.processing_info.state;
    let checkAfter = finalizeData.processing_info.check_after_secs || 5;
    while (state === 'pending' || state === 'in_progress') {
      await new Promise(r => setTimeout(r, checkAfter * 1000));
      const statusUrl = `https://upload.twitter.com/1.1/media/upload.json`;
      const statusQueryParams = { command: 'STATUS', media_id: mediaId };
      const statusHeader = getOAuthHeader('GET', statusUrl, statusQueryParams);

      const statusRes = await fetch(`${statusUrl}?command=STATUS&media_id=${mediaId}`, {
        method: 'GET',
        headers: { Authorization: statusHeader }
      });
      const statusData = await statusRes.json() as any;
      state = statusData.processing_info?.state || 'failed';
      checkAfter = statusData.processing_info?.check_after_secs || 5;
      console.log(`Video processing state: ${state}`);
    }
    if (state === 'failed') {
      throw new Error('Twitter video processing failed.');
    }
  }

  console.log('Creating Tweet...');
  const tweetUrl = 'https://api.twitter.com/2/tweets';
  const tweetBody = {
    text: caption,
    media: { media_ids: [mediaId] }
  };
  
  const tweetHeader = getOAuthHeader('POST', tweetUrl, {}, {});
  const tweetRes = await fetch(tweetUrl, {
    method: 'POST',
    headers: {
      Authorization: tweetHeader,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(tweetBody)
  });

  const tweetData = await tweetRes.json() as any;
  if (tweetRes.ok) {
    console.log(`Tweet posted successfully! ID: ${tweetData.data.id}`);
    return `Tweet Posted! ID: ${tweetData.data.id}`;
  } else {
    throw new Error(`Failed to post Tweet: ${JSON.stringify(tweetData)}`);
  }
}

// 3. Post to YouTube (Shorts)
async function postToYouTube(videoPath: string, gameTitle: string, caption: string): Promise<string> {
  if (!process.env.YT_CLIENT_ID || !process.env.YT_REFRESH_TOKEN || !process.env.YT_CLIENT_SECRET) {
    throw new Error('Missing YouTube API credentials in environment variables.');
  }

  console.log('Refreshing Google API Access Token...');
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.YT_CLIENT_ID,
      client_secret: process.env.YT_CLIENT_SECRET,
      refresh_token: process.env.YT_REFRESH_TOKEN,
      grant_type: 'refresh_token'
    })
  });
  const tokenData = await tokenRes.json() as any;
  if (!tokenRes.ok || !tokenData.access_token) {
    throw new Error(`Failed to refresh Google Access Token: ${JSON.stringify(tokenData)}`);
  }
  const accessToken = tokenData.access_token;

  console.log('Uploading Video to YouTube...');
  const videoBuffer = fs.readFileSync(videoPath);
  const metadata = {
    snippet: {
      title: `Play ${gameTitle} Instantly! #shorts`,
      description: caption,
      categoryId: '20' // Gaming
    },
    status: {
      privacyStatus: 'public',
      selfDeclaredMadeForKids: false
    }
  };

  const boundary = '-------314159265358979323846';
  const metadataPart = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify(metadata),
    ''
  ].join('\r\n');

  const videoHeader = [
    `--${boundary}`,
    'Content-Type: video/webm',
    'Content-Transfer-Encoding: binary',
    '',
    ''
  ].join('\r\n');

  const footer = `\r\n--${boundary}--`;
  const body = Buffer.concat([
    Buffer.from(metadataPart),
    Buffer.from(videoHeader),
    videoBuffer,
    Buffer.from(footer)
  ]);

  const uploadRes = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
      'Content-Length': body.length.toString()
    },
    body
  });

  const uploadData = await uploadRes.json() as any;
  if (uploadRes.ok) {
    console.log(`YouTube Short uploaded successfully! Video ID: ${uploadData.id}`);
    return `YouTube Short Uploaded! ID: ${uploadData.id}`;
  } else {
    throw new Error(`YouTube upload failed: ${JSON.stringify(uploadData)}`);
  }
}

// 4. Post to Facebook Page
async function postToFacebook(videoPath: string, caption: string): Promise<string> {
  if (!process.env.META_ACCESS_TOKEN || !process.env.FB_PAGE_ID) {
    throw new Error('Missing Meta Page token or Facebook Page ID in environment variables.');
  }

  const fbUrl = `https://graph.facebook.com/v19.0/${process.env.FB_PAGE_ID}/videos`;
  const videoBuffer = fs.readFileSync(videoPath);

  const fbFormData = new FormData();
  fbFormData.append('access_token', process.env.META_ACCESS_TOKEN);
  fbFormData.append('description', caption);
  fbFormData.append('source', new Blob([videoBuffer]), 'gameplay.webm');

  const res = await fetch(fbUrl, {
    method: 'POST',
    body: fbFormData
  });

  const data = await res.json() as any;
  if (res.ok) {
    console.log(`Facebook page video posted successfully! ID: ${data.id}`);
    return `Facebook Page Video Posted! ID: ${data.id}`;
  } else {
    throw new Error(`Facebook post failed: ${JSON.stringify(data)}`);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { action, gameSlug, gameTitle, gameDescription, gameTags, caption, platforms } = await req.json();

    if (!action) {
      return NextResponse.json({ success: false, error: 'Action is required' }, { status: 400 });
    }

    const tempDir = path.resolve(process.cwd(), 'public/temp_promo');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const videoPath = path.join(tempDir, `${gameSlug || 'game'}_gameplay.webm`);
    const relativeVideoUrl = `/temp_promo/${gameSlug || 'game'}_gameplay.webm`;

    // ── Action 1: Record Gameplay Video ──────────────────────────────────────
    if (action === 'record') {
      if (!gameSlug) {
        return NextResponse.json({ success: false, error: 'gameSlug is required for recording' }, { status: 400 });
      }
      
      const success = await recordGameplay(gameSlug, videoPath);
      if (success) {
        return NextResponse.json({ success: true, videoUrl: `${relativeVideoUrl}?t=${Date.now()}` });
      } else {
        return NextResponse.json({ success: false, error: 'Failed to generate gameplay video' }, { status: 500 });
      }
    }

    // ── Action 2: Generate AI Caption via Gemini ──────────────────────────────
    if (action === 'caption') {
      if (!gameTitle) {
        return NextResponse.json({ success: false, error: 'gameTitle is required for caption' }, { status: 400 });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      const gameUrl = `https://www.fliptripgames.com/game/${gameSlug || ''}`;
      
      if (!apiKey) {
        // Fallback mock caption if no API key is configured
        const fallbackCaption = `Play ${gameTitle} now on FlipTrip Games! No downloads or sign-ups required. Just click and play: ${gameUrl} #gaming #freegames`;
        return NextResponse.json({ success: true, caption: fallbackCaption });
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `
You are an expert social media manager for a premium online gaming portal called FlipTrip Games.
Generate a short, viral, highly engaging social media caption (status text) and hashtags for the game "${gameTitle}".

Game Details:
Title: ${gameTitle}
Description: ${gameDescription || 'None'}
Tags: ${gameTags || 'None'}
Link: ${gameUrl}

Requirements:
- Caption must be brief, catchy, and action-oriented.
- Highlight that it is a free, instant browser game (no downloads needed).
- Include the link "${gameUrl}" in the post.
- Add 3-5 relevant hashtags (e.g. #gaming, #indiegames, #freegames, #browsergames).
- Keep the overall length under 280 characters so it fits on Twitter/X easily.

Return ONLY a raw JSON object with no markdown formatting or backticks.
The object must have exactly this key:
- caption (string)
`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      let rawText = response.text || '{}';
      rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedData = JSON.parse(rawText);

      return NextResponse.json({ success: true, caption: parsedData.caption });
    }

    // ── Action 3: Publish to Social Networks ─────────────────────────────────
    if (action === 'publish') {
      if (!gameSlug || !caption || !platforms || !Array.isArray(platforms)) {
        return NextResponse.json({ success: false, error: 'gameSlug, caption, and platforms array are required for publishing' }, { status: 400 });
      }

      if (!fs.existsSync(videoPath)) {
        return NextResponse.json({ success: false, error: 'Gameplay video does not exist. Please generate it first.' }, { status: 400 });
      }

      const gameUrl = `https://www.fliptripgames.com/game/${gameSlug}`;
      const results: Record<string, any> = {};
      const errors: Record<string, string> = {};

      // X (Twitter)
      if (platforms.includes('x')) {
        try {
          results.x = await postToX(videoPath, caption);
        } catch (err: any) {
          errors.x = err.message || 'Unknown error';
        }
      }

      // YouTube (Shorts)
      if (platforms.includes('youtube')) {
        try {
          results.youtube = await postToYouTube(videoPath, gameTitle || gameSlug, caption);
        } catch (err: any) {
          errors.youtube = err.message || 'Unknown error';
        }
      }

      // Facebook Page
      if (platforms.includes('facebook')) {
        try {
          results.facebook = await postToFacebook(videoPath, caption);
        } catch (err: any) {
          errors.facebook = err.message || 'Unknown error';
        }
      }

      const hasFailures = Object.keys(errors).length > 0;
      return NextResponse.json({
        success: !hasFailures || Object.keys(results).length > 0,
        results,
        errors
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action parameter' }, { status: 400 });
  } catch (error: any) {
    console.error('Promotion API Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
