import { useState, useRef, useCallback, useEffect } from 'react';

// Global reference to prevent stream from being garbage collected
let globalStreamRef: MediaStream | null = null;

export const useCamera = () => {
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const monitorIntervalRef = useRef<number | null>(null);

  const startCamera = useCallback(async () => {
    try {
      // Stop any existing stream first to avoid conflicts
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: true // Enable audio for recording
      });

      streamRef.current = stream;
      // Also store globally to prevent garbage collection
      globalStreamRef = stream;
      
      console.log('Stream stored:', {
        streamId: stream.id,
        active: stream.active,
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length,
      });
      
      // Ensure video element is ready
      if (videoRef.current) {
        const video = videoRef.current;
        
        // Set the stream
        video.srcObject = stream;
        
        // Set autoplay and playsinline to ensure continuous playback
        video.setAttribute('autoplay', 'true');
        video.setAttribute('playsinline', 'true');
        video.setAttribute('muted', 'true'); // Muted to allow autoplay
        
        // Wait for video to be ready and playing
        await new Promise((resolve, reject) => {
          if (!videoRef.current) {
            reject(new Error('Video element not available'));
            return;
          }
          
          const onLoadedMetadata = () => {
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            
            // Ensure video keeps playing
            video.play().then(() => {
              // Set up event listeners to keep stream alive
              video.addEventListener('pause', () => {
                if (streamRef.current && streamRef.current.active) {
                  video.play().catch(err => console.warn('Auto-resume failed:', err));
                }
              });
              
              resolve(true);
            }).catch(reject);
          };
          
          const onError = () => {
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            reject(new Error('Video failed to load'));
          };
          
          video.addEventListener('loadedmetadata', onLoadedMetadata);
          video.addEventListener('error', onError);
          
          // Start playing immediately
          video.play().catch(err => {
            console.warn('Initial play failed, will retry:', err);
          });
        });
      }

      setIsActive(true);
      setError(null);
      
      // Add track event listeners to monitor stream health
      stream.getVideoTracks().forEach(track => {
        track.onended = () => {
          console.error('Video track ended! State:', track.readyState);
          setIsActive(false);
        };
        
        track.onmute = () => {
          console.warn('Video track muted');
        };
        
        track.onunmute = () => {
          console.log('Video track unmuted');
        };
      });
      
      stream.getAudioTracks().forEach(track => {
        track.onended = () => {
          console.warn('Audio track ended');
        };
      });
      
      // Monitor stream health - check if stream is still active
      monitorIntervalRef.current = window.setInterval(() => {
        if (!streamRef.current) {
          console.warn('Stream ref is null!');
          return;
        }

        const stream = streamRef.current;
        const videoTracks = stream.getVideoTracks();
        const video = videoRef.current;
        
        // Log stream status for debugging
        console.log('Stream health check:', {
          streamActive: stream.active,
          videoTracksCount: videoTracks.length,
          videoTrackState: videoTracks[0]?.readyState,
          videoTrackEnabled: videoTracks[0]?.enabled,
          videoElementExists: !!video,
          videoSrcObject: !!video?.srcObject,
          videoPaused: video?.paused,
          videoReadyState: video?.readyState,
        });
        
        if (videoTracks.length > 0) {
          const track = videoTracks[0];
          
          // Check if track is still live
          if (track.readyState !== 'live') {
            console.error('Video track is not live! State:', track.readyState);
            setIsActive(false);
            return;
          }
          
          // Ensure track is enabled
          if (!track.enabled) {
            console.warn('Video track was disabled, re-enabling...');
            track.enabled = true;
          }
          
          // Ensure video element has the stream
          if (video && !video.srcObject) {
            console.warn('Video element lost stream, reattaching...');
            video.srcObject = stream;
            video.play().catch(err => {
              console.error('Failed to play after reattach:', err);
            });
          }
          
          // Ensure video is playing
          if (video && video.paused && stream.active) {
            console.warn('Video is paused, resuming...');
            video.play().catch(err => {
              console.error('Failed to resume video:', err);
            });
          }
          
          // Update active state based on actual stream status
          if (stream.active && track.readyState === 'live' && video && video.readyState >= 2) {
            setIsActive(true);
          } else {
            console.warn('Stream appears inactive');
            setIsActive(false);
          }
        }
      }, 2000); // Check every 2 seconds
      
      return stream; // Return stream for recording
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Failed to access camera. Please grant camera permissions.');
      setIsActive(false);
      throw err;
    }
  }, []);

  const stopCamera = useCallback(() => {
    console.log('Stopping camera...');
    
    // Clear monitoring interval
    if (monitorIntervalRef.current) {
      clearInterval(monitorIntervalRef.current);
      monitorIntervalRef.current = null;
    }
    
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach(track => {
        // Remove event listeners first
        track.onended = null;
        track.onmute = null;
        track.onunmute = null;
        // Then stop the track
        track.stop();
      });
      streamRef.current = null;
    }
    
    // Clear global reference
    globalStreamRef = null;

    if (videoRef.current) {
      // Remove event listeners
      const video = videoRef.current;
      video.onpause = null;
      video.onplay = null;
      video.onloadedmetadata = null;
      video.onerror = null;
      // Clear srcObject
      video.srcObject = null;
    }

    setIsActive(false);
    console.log('Camera stopped');
  }, []);

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL('image/jpeg');
  }, []);

  // Track head position for movement calculation
  const lastHeadPositionRef = useRef<{ x: number; y: number; z: number } | null>(null);
  const headMovementHistoryRef = useRef<number[]>([]);

  // Analyze eye contact and head movement using video analysis
  const analyzeEyeContact = useCallback(() => {
    if (!videoRef.current) {
      return { score: 0, isLooking: false };
    }

    const video = videoRef.current;
    
    // Check if video is active and has dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0 || video.readyState < 2) {
      return { score: 50, isLooking: false };
    }

    // Use canvas to analyze video frame
    if (!canvasRef.current) {
      return { score: 50, isLooking: false };
    }

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    
    if (!context) {
      return { score: 50, isLooking: false };
    }

    // Draw current frame to canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Analyze frame for face position
    // Get center region of video (where face should be)
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const regionSize = Math.min(canvas.width, canvas.height) / 3;
    
    // Sample pixels in center region to detect face-like features
    // (simplified - in production use face detection library)
    const imageData = context.getImageData(
      centerX - regionSize / 2,
      centerY - regionSize / 2,
      regionSize,
      regionSize
    );
    
    // Estimate face centroid in the ROI using skin-like pixels.
    // This avoids random head movement noise and gives steadier metrics.
    let totalBrightness = 0;
    let pixelCount = 0;
    let weightedX = 0;
    let weightedY = 0;
    let totalWeight = 0;
    const roiWidth = Math.floor(regionSize);
    const roiHeight = Math.floor(regionSize);

    for (let i = 0; i < imageData.data.length; i += 4) {
      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];
      const brightness = (r + g + b) / 3;
      totalBrightness += brightness;
      pixelCount++;

      const pixelIndex = i / 4;
      const px = pixelIndex % roiWidth;
      const py = Math.floor(pixelIndex / roiWidth);
      const isSkinTone =
        r > 60 &&
        g > 40 &&
        b > 30 &&
        r > g * 0.95 &&
        g > b * 0.9;

      if (isSkinTone) {
        const weight = Math.max(1, brightness);
        weightedX += px * weight;
        weightedY += py * weight;
        totalWeight += weight;
      }
    }
    
    const avgBrightness = pixelCount > 0 ? totalBrightness / pixelCount : 0;
    const roiStartX = centerX - regionSize / 2;
    const roiStartY = centerY - regionSize / 2;
    const fallbackX = regionSize / 2;
    const fallbackY = regionSize / 2;
    const centroidX = totalWeight > 0 ? weightedX / totalWeight : fallbackX;
    const centroidY = totalWeight > 0 ? weightedY / totalWeight : fallbackY;
    const headX = roiStartX + centroidX;
    const headY = roiStartY + centroidY;
    const headZ = 0;
    
    const distanceFromCenter = Math.sqrt(
      Math.pow(headX - centerX, 2) + Math.pow(headY - centerY, 2)
    );
    const maxDistance = Math.max(1, regionSize / 2);
    const centerAlignment = 1 - Math.min(1, distanceFromCenter / maxDistance);
    const normalizedBrightness = Math.min(1, avgBrightness / 180);

    // Blend center alignment + brightness confidence for a more stable score.
    const eyeContactScore = Math.max(
      45,
      Math.min(98, (centerAlignment * 0.72 + normalizedBrightness * 0.28) * 100)
    );
    
    // Calculate head movement
    let headMovement = 0;
    if (lastHeadPositionRef.current) {
      const dx = headX - lastHeadPositionRef.current.x;
      const dy = headY - lastHeadPositionRef.current.y;
      const dz = headZ - lastHeadPositionRef.current.z;
      headMovement = Math.sqrt(dx * dx + dy * dy + dz * dz);
      headMovementHistoryRef.current.push(headMovement);
      
      if (headMovementHistoryRef.current.length > 10) {
        headMovementHistoryRef.current.shift();
      }
    }
    lastHeadPositionRef.current = { x: headX, y: headY, z: headZ };
    
    return {
      score: Math.floor(eyeContactScore),
      isLooking: eyeContactScore > 65,
      headMovement: headMovement,
    };
  }, [videoRef, canvasRef]);

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      console.log('useCamera hook unmounting, cleaning up...');
      if (monitorIntervalRef.current) {
        clearInterval(monitorIntervalRef.current);
        monitorIntervalRef.current = null;
      }
      // Only stop if stream is still active
      if (streamRef.current && streamRef.current.active) {
        stopCamera();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run on unmount

  return {
    videoRef,
    canvasRef,
    isActive,
    error,
    startCamera,
    stopCamera,
    captureFrame,
    analyzeEyeContact,
  };
};
