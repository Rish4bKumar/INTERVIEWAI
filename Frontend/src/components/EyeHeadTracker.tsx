import React, { useEffect } from "react";
import {
  FaceLandmarker,
  FilesetResolver,
  FaceLandmarkerResult,
} from "@mediapipe/tasks-vision";

interface Props {
  videoElement: HTMLVideoElement | null;  // parent video element (from useCamera)
  onScore: (score: number) => void;
}

const EyeHeadTracker: React.FC<Props> = ({ videoElement, onScore }) => {
  useEffect(() => {
    if (!videoElement) return;

    let landmarker: FaceLandmarker | null = null;
    let rafId: number;

    let destroyed = false;

    async function init() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          },
          runningMode: "VIDEO",
          numFaces: 1,
        });

        if (!destroyed) {
          loop();
        }
      } catch (error) {
        console.error("MediaPipe load error:", error);
      }
    }

    const loop = () => {
      if (destroyed) return;

      if (
        !videoElement ||
        !landmarker ||
        videoElement.readyState < 2 || // HAVE_CURRENT_DATA
        videoElement.videoWidth === 0 ||
        videoElement.videoHeight === 0 ||
        videoElement.paused ||
        videoElement.ended
      ) {
        // Video not ready yet – try again next frame
        rafId = requestAnimationFrame(loop);
        return;
      }

      try {
        const result: FaceLandmarkerResult = landmarker.detectForVideo(
          videoElement,
          performance.now()
        );

        if (result.faceLandmarks?.length) {
          const score = calculateScore(result.faceLandmarks[0]);
          onScore(score);
        }
      } catch (err) {
        // Avoid spamming errors when face leaves frame – just log once per issue
        console.warn("MediaPipe detection error:", err);
      }

      rafId = requestAnimationFrame(loop);
    };

    init();

    return () => {
      destroyed = true;
      if (rafId) cancelAnimationFrame(rafId);
      // @ts-ignore – close exists in tasks-vision, but TS types might not declare it
      if (landmarker && typeof (landmarker as any).close === "function") {
        try {
          (landmarker as any).close();
        } catch {
          // ignore
        }
      }
    };
  }, [videoElement, onScore]);

  return null; // no DOM element needed
};

// ======================
// SCORE CALCULATION LOGIC
// ======================
function calculateScore(landmarks: any[]) {
  try {
    const leftEye = landmarks[386];
    const rightEye = landmarks[159];
    const noseTip = landmarks[1];

    // HEAD MOVEMENT (how far from center)
    const headTilt = Math.abs(noseTip.x - 0.5) * 100;
    const headScore = Math.max(0, 100 - headTilt);

    // EYE FOCUS (rough check – tweak threshold as needed)
    const eyeDist = Math.abs(leftEye.x - rightEye.x);
    const eyeScore = eyeDist < 0.06 ? 100 : 60;

    return Math.round(headScore * 0.4 + eyeScore * 0.6);
  } catch {
    return 0;
  }
}

export default EyeHeadTracker;
