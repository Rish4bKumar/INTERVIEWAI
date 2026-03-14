import { useRef, useCallback, useEffect } from 'react';

interface FaceDetectionResult {
  eyeContactScore: number;
  headMovementScore: number;
  isLooking: boolean;
  headPosition: { x: number; y: number; z: number } | null;
}

export const useFaceDetection = (videoRef: React.RefObject<HTMLVideoElement>) => {
  const faceMeshRef = useRef<any>(null);
  const isInitializedRef = useRef(false);
  const lastHeadPositionRef = useRef<{ x: number; y: number; z: number } | null>(null);
  const headMovementHistoryRef = useRef<number[]>([]);

  // Initialize MediaPipe Face Mesh
  const initializeFaceMesh = useCallback(async () => {
    if (isInitializedRef.current || !videoRef.current) return;

    try {
      // Load MediaPipe Face Mesh from CDN
      if (!(window as any).FaceMesh) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh';
        script.type = 'module';
        document.head.appendChild(script);
        
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          setTimeout(reject, 10000); // 10 second timeout
        });
      }

      const { FaceMesh } = (window as any);
      
      const faceMesh = new FaceMesh({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        }
      });

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      faceMeshRef.current = faceMesh;
      isInitializedRef.current = true;
      console.log('Face Mesh initialized');
    } catch (error) {
      console.error('Failed to initialize Face Mesh:', error);
      // Fallback to basic detection
    }
  }, [videoRef]);

  // Detect face and calculate metrics
  const detectFace = useCallback((): FaceDetectionResult => {
    if (!videoRef.current || !faceMeshRef.current) {
      return {
        eyeContactScore: 50,
        headMovementScore: 80,
        isLooking: false,
        headPosition: null,
      };
    }

    const video = videoRef.current;
    
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      return {
        eyeContactScore: 50,
        headMovementScore: 80,
        isLooking: false,
        headPosition: null,
      };
    }

    // For now, use a simplified approach until MediaPipe is fully loaded
    // In production, you would process the video frame through FaceMesh
    // and analyze the landmarks to determine eye position and head pose
    
    // Simplified detection based on video center
    const centerX = video.videoWidth / 2;
    const centerY = video.videoHeight / 2;
    
    // Mock head position (in real implementation, get from face mesh)
    const headX = centerX + (Math.random() - 0.5) * 50;
    const headY = centerY + (Math.random() - 0.5) * 50;
    const headZ = 0;
    
    const headPosition = { x: headX, y: headY, z: headZ };
    
    // Calculate head movement
    let headMovement = 0;
    if (lastHeadPositionRef.current) {
      const dx = headX - lastHeadPositionRef.current.x;
      const dy = headY - lastHeadPositionRef.current.y;
      const dz = headZ - lastHeadPositionRef.current.z;
      headMovement = Math.sqrt(dx * dx + dy * dy + dz * dz);
      headMovementHistoryRef.current.push(headMovement);
      
      // Keep only last 10 measurements
      if (headMovementHistoryRef.current.length > 10) {
        headMovementHistoryRef.current.shift();
      }
    }
    lastHeadPositionRef.current = headPosition;
    
    // Calculate average head movement
    const avgMovement = headMovementHistoryRef.current.length > 0
      ? headMovementHistoryRef.current.reduce((a, b) => a + b, 0) / headMovementHistoryRef.current.length
      : 0;
    
    // Head movement score (less movement = higher score)
    const headMovementScore = Math.max(0, Math.min(100, 100 - (avgMovement / 2)));
    
    // Eye contact score (simplified - in real implementation, analyze eye landmarks)
    // Check if face is centered (looking at camera)
    const distanceFromCenter = Math.sqrt(
      Math.pow(headX - centerX, 2) + Math.pow(headY - centerY, 2)
    );
    const maxDistance = Math.min(video.videoWidth, video.videoHeight) / 4;
    const eyeContactScore = Math.max(0, Math.min(100, 100 - (distanceFromCenter / maxDistance) * 100));
    
    return {
      eyeContactScore: Math.round(eyeContactScore),
      headMovementScore: Math.round(headMovementScore),
      isLooking: eyeContactScore > 70,
      headPosition,
    };
  }, [videoRef]);

  // Initialize on mount
  useEffect(() => {
    if (videoRef.current) {
      initializeFaceMesh();
    }
  }, [initializeFaceMesh, videoRef]);

  return {
    detectFace,
    isInitialized: isInitializedRef.current,
  };
};

