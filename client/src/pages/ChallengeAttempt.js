import React, { useState, useEffect, useRef, useContext, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import AuthContext from "../context/authContext";
import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Icon,
  Spinner,
  Progress,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Collapse,
  List,
  ListItem,
  Badge,
  Tooltip,
  useToast,
  useColorModeValue,
  Divider,
  Center,
  IconButton,
} from "@chakra-ui/react";
import {
  FaPlay,
  FaStop,
  FaMicrophone,
  FaLightbulb,
  FaChevronDown,
  FaChevronRight,
  FaCheckCircle,
  FaExclamationCircle,
  FaArrowLeft,
  FaRedo,
} from "react-icons/fa";

const ChallengeAttempt = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  const toast = useToast();
  const { assignmentActive, assignmentId, enableHints } = location.state || {};

  // Challenge data states
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Transcription states
  const [transcript, setTranscript] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [transcriptTimestamps, setTranscriptTimestamps] = useState([]);
  
  // UI states
  const [showHints, setShowHints] = useState(true);
  const transcriptContainerRef = useRef(null);
  
  // Refs for media handling
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const chunksRef = useRef([]);
  // Ref to track recording state reliably in callbacks
  const isRecordingRef = useRef(isRecording);
  // Ref to manage restart attempts and timeouts
  const restartAttemptsRef = useRef(0);
  const restartTimeoutRef = useRef(null);
  const MAX_RESTART_ATTEMPTS = 5;

  // Alert dialog for exit confirmation
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef();
  
  // Color mode values
  const bgColor = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const countdownBg = useColorModeValue("rgba(255,255,255,0.7)", "rgba(45,55,72,0.7)");
  const countdownTextColor = useColorModeValue("brand.600", "brand.300");

  // Define colors for transcript text outside conditional rendering
  const finalTranscriptColor = useColorModeValue('black', 'white');
  const interimTranscriptColor = useColorModeValue('gray.500', 'gray.400');

  // Keep isRecordingRef updated
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  // Fetch challenge data
  useEffect(() => {
    const fetchChallenge = async () => {
      setLoading(true); // Start loading
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/challenges/${id}`,
          {
            headers: { "x-auth-token": token },
          }
        );
        setChallenge(res.data);
        
        if (assignmentId) {
          try {
            const progressRes = await axios.get(
              `${process.env.REACT_APP_API_URL}/api/assignments/${assignmentId}/progress`,
              { headers: { "x-auth-token": token } }
            );
            const currentChallengeCompleted = progressRes.data.completedChallengeIds.includes(id);
            const challengeIndex = progressRes.data.challenges.findIndex(c => c._id === id || c === id);
            const currentPosition = challengeIndex !== -1 ? challengeIndex : 0;
            
            setProgress({
              current: currentPosition,
              total: progressRes.data.totalChallenges,
              completed: progressRes.data.completedChallenges,
              isCurrentChallengeCompleted: currentChallengeCompleted
            });
          } catch (err) {
            console.error("Failed to fetch progress:", err);
            // Non-critical error, continue loading challenge
          }
        }
      } catch (err) {
        console.error("Failed to fetch challenge:", err);
        toast({
          title: "Error",
          description: "Failed to fetch challenge details",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        // Navigate back or show error state if challenge loading fails
        navigate('/challenges'); // Example: navigate back
      } finally {
        setLoading(false); // Stop loading
      }
    };

    fetchChallenge();
  }, [id, token, assignmentId, toast, navigate]);

  // --- Simplified Speech Recognition Setup ---

  const cleanupRecognition = useCallback(() => {
    if (recognitionRef.current) {
      // Remove listeners to prevent memory leaks
      recognitionRef.current.onresult = null;
      recognitionRef.current.onerror = null;
      recognitionRef.current.onend = null;
      try {
        // Stop if it's running
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore errors during cleanup stop
      }
      recognitionRef.current = null;
    }
    // Clear any pending restart timeouts
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    setIsTranscribing(false); // Ensure state reflects cleanup
  }, []);

  const initializeSpeechRecognition = useCallback(() => {
    // Clean up any existing instance first
    cleanupRecognition();

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({
        title: "Browser Not Supported",
        description: "Speech recognition not available in this browser.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return null; // Indicate failure
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true; // Keep listening even after pauses
    recognition.interimResults = true; // Get results as they come
    recognition.lang = 'en-IN'; // Set language

    const recognitionStartTime = Date.now() / 1000;
    const interimStartTimes = new Map();
    let currentInterimId = 0;

    recognition.onresult = (event) => {
      restartAttemptsRef.current = 0; // Reset restart attempts on successful result
      let currentInterim = '';
      let newFinal = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptSegment = event.results[i][0].transcript;
        const resultId = `${i}-${currentInterimId}`;

        if (!interimStartTimes.has(resultId)) {
          interimStartTimes.set(resultId, Date.now() / 1000 - recognitionStartTime);
        }

        if (event.results[i].isFinal) {
          newFinal += transcriptSegment + ' ';
          const startTime = interimStartTimes.get(resultId) || (Date.now() / 1000 - recognitionStartTime - 1);
          const endTime = Date.now() / 1000 - recognitionStartTime;

          setTranscriptTimestamps(prev => [
            ...prev,
            { words: transcriptSegment.trim(), timeStart: startTime, timeEnd: endTime }
          ]);
          interimStartTimes.delete(resultId);
          currentInterimId++;
        } else {
          currentInterim += transcriptSegment;
        }
      }

      // Update transcript state using functional updates
      setFinalTranscript(prevFinal => {
        const updatedFinal = newFinal ? prevFinal + newFinal : prevFinal;
        setInterimTranscript(currentInterim);
        setTranscript(updatedFinal + currentInterim);
        return updatedFinal;
      });

      // Auto-scroll
      if (transcriptContainerRef.current) {
        transcriptContainerRef.current.scrollTop = transcriptContainerRef.current.scrollHeight;
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error, event.message);
      // Handle critical errors that might require stopping or user action
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        toast({
          title: "Microphone Access Denied",
          description: "Please allow microphone access for transcription.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        setIsTranscribing(false); // Stop trying if permission denied
      } else if (event.error === 'no-speech') {
        console.log("No speech detected, recognition might stop and restart.");
        // Let onend handle potential restart
      } else if (event.error === 'network') {
         toast({
            title: "Network Error",
            description: "Speech recognition service unavailable. Check connection.",
            status: "warning",
            duration: 3000,
            isClosable: true,
          });
         // Let onend handle potential restart
      } else if (event.error === 'audio-capture') {
         toast({
            title: "Audio Capture Error",
            description: "Problem with the microphone.",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
         setIsTranscribing(false); // Stop trying if audio hardware issue
      } else {
         console.warn(`Unhandled speech recognition error: ${event.error}`);
         // Let onend handle potential restart for other errors
      }
    };

    recognition.onend = () => {
      console.log("Speech recognition ended.");
      // Only attempt restart if we are *supposed* to be recording
      if (isRecordingRef.current) {
        restartAttemptsRef.current++;
        if (restartAttemptsRef.current <= MAX_RESTART_ATTEMPTS) {
          const delayMs = Math.min(500 * Math.pow(1.5, restartAttemptsRef.current - 1), 5000); // Exponential backoff
          console.log(`Attempting to restart recognition (attempt ${restartAttemptsRef.current}) in ${delayMs}ms...`);

          // Clear previous timeout if exists
          if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);

          restartTimeoutRef.current = setTimeout(() => {
            // Double-check if still recording before starting
            if (isRecordingRef.current && recognitionRef.current) {
              try {
                recognitionRef.current.start();
                console.log("Recognition restarted successfully.");
                setIsTranscribing(true); // Ensure state is correct
                // Reset attempts ONLY if start() doesn't throw immediately
                // Note: onresult will reset it fully upon receiving data
              } catch (err) {
                console.error(`Failed to restart recognition (attempt ${restartAttemptsRef.current}):`, err);
                // Don't immediately retry, wait for next 'onend' or manual restart
                setIsTranscribing(false);
                if (restartAttemptsRef.current >= MAX_RESTART_ATTEMPTS) {
                   toast({
                      title: "Transcription Failed",
                      description: "Speech recognition could not be restarted. Try manual restart or refresh.",
                      status: "error",
                      duration: 5000,
                      isClosable: true,
                    });
                }
              }
            } else {
               console.log("Restart aborted, recording stopped.");
               setIsTranscribing(false);
            }
          }, delayMs);
        } else {
          console.error("Max restart attempts reached. Stopping transcription.");
          setIsTranscribing(false);
          toast({
            title: "Transcription Stopped",
            description: "Speech recognition failed after multiple attempts. Please use the restart button or refresh.",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
        }
      } else {
        // If recording was stopped intentionally, ensure transcription state is off
        setIsTranscribing(false);
        console.log("Recognition ended because recording stopped.");
      }
    };

    recognitionRef.current = recognition;
    return recognition; // Return the instance

  }, [toast, cleanupRecognition]); // Dependencies: toast, cleanupRecognition

  // Manual restart function
  const restartTranscription = useCallback(() => {
    if (!isRecordingRef.current) {
      toast({ title: "Cannot restart", description: "Recording is not active.", status: "warning", duration: 2000 });
      return;
    }

    console.log("Manual restart triggered.");
    toast({ title: "Restarting Transcription...", status: "info", duration: 1500 });

    // Preserve existing transcript by adding any interim content to the final transcript
    setFinalTranscript(prev => {
      const preservedTranscript = prev + interimTranscript;
      console.log("Preserving transcript before restart:", preservedTranscript);
      return preservedTranscript;
    });
    setInterimTranscript(''); // Clear interim for fresh start

    // Clean up old instance and timers completely
    cleanupRecognition();
    restartAttemptsRef.current = 0; // Reset attempts on manual restart

    // Initialize and start a fresh instance after a short delay
    setTimeout(() => {
        const newRecognition = initializeSpeechRecognition();
        if (newRecognition && isRecordingRef.current) {
            try {
                newRecognition.start();
                setIsTranscribing(true);
                console.log("Manual restart successful.");
            } catch (err) {
                console.error("Error starting recognition after manual restart:", err);
                setIsTranscribing(false);
                toast({ title: "Restart Failed", description: "Could not restart transcription.", status: "error", duration: 3000 });
            }
        } else if (!newRecognition) {
             console.error("Failed to initialize recognition for manual restart.");
        } else {
             console.log("Recording stopped before manual restart could complete.");
        }
    }, 300); // Short delay to ensure cleanup

  }, [initializeSpeechRecognition, cleanupRecognition, toast]);


  // Start recording process
  const startRecording = async () => {
    // Reset states for a new recording attempt
    setRecordedBlob(null);
    setTranscript("");
    setFinalTranscript("");
    setInterimTranscript("");
    setTranscriptTimestamps([]);
    setRecordingTime(0);
    restartAttemptsRef.current = 0; // Reset restart counter
    cleanupStream(); // Ensure previous stream is stopped
    cleanupRecognition(); // Ensure previous recognition is stopped

    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
        audio: { echoCancellation: true, noiseSuppression: true }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.controls = false; // Ensure controls are off during recording
        videoRef.current.muted = true; // Keep preview muted
        await videoRef.current.play().catch(err => console.error("Error playing video preview:", err));
      }

      // Start countdown
      setCountdown(3);
      let count = 3;
      const countdownInterval = setInterval(() => {
        count--;
        setCountdown(count);
        if (count === 0) {
          clearInterval(countdownInterval);
          setTimeout(() => {
            setCountdown(null);
            beginRecording(); // Start actual recording
          }, 1000); // Brief pause after countdown
        }
      }, 1000);

    } catch (err) {
      console.error("Error accessing media devices:", err);
      let description = "Please allow camera and microphone access.";
      if (err.name === "NotAllowedError") {
        description = "Camera and microphone access was denied. Please enable it in your browser settings.";
      } else if (err.name === "NotFoundError") {
         description = "No camera or microphone found. Please ensure they are connected and enabled.";
      }
      toast({
        title: "Device Access Error",
        description: description,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Begin actual recording after countdown
  const beginRecording = () => {
    if (!streamRef.current || !streamRef.current.active) {
      console.error("Stream is not available or active when beginning recording");
      toast({ title: "Recording Failed", description: "Camera stream lost. Please try again.", status: "error", duration: 5000 });
      return;
    }

    // Initialize recognition *before* starting MediaRecorder
    const recognition = initializeSpeechRecognition();

    // Clear previous recording data
    chunksRef.current = [];
    setRecordingTime(0); // Reset timer

    try {
      const options = { mimeType: 'video/webm;codecs=vp8,opus' }; // Specify codecs for better compatibility
      mediaRecorderRef.current = new MediaRecorder(streamRef.current, options);

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        console.log("MediaRecorder stopped.");
        // Stop recognition when recorder stops
        cleanupRecognition(); // Use cleanup function

        if (chunksRef.current.length === 0) {
          console.error("No data recorded.");
          toast({ title: "Recording Failed", description: "No video data captured.", status: "error", duration: 5000 });
          setRecordedBlob(null); // Ensure no blob state
        } else {
          const blob = new Blob(chunksRef.current, { type: options.mimeType });
          setRecordedBlob(blob);
          // Setup preview for the recorded blob
          if (videoRef.current) {
            const videoURL = URL.createObjectURL(blob);
            videoRef.current.srcObject = null; // Clear the live stream
            videoRef.current.src = videoURL;
            videoRef.current.muted = false; // Allow playback sound
            videoRef.current.controls = true; // Show controls for review
            videoRef.current.currentTime = 0; // Reset to start
          }
        }
        // Reset UI state AFTER processing blob
        setIsRecording(false); // Handled by isRecordingRef update
        clearInterval(timerRef.current);
        timerRef.current = null;
      };

      mediaRecorderRef.current.onerror = (event) => {
        console.error("MediaRecorder error:", event.error);
        toast({ title: "Recording Error", description: `An error occurred: ${event.error.name}`, status: "error", duration: 5000 });
        stopRecording(); // Stop everything on recorder error
      };

      // Start recording
      mediaRecorderRef.current.start(1000); // Collect data every second
      setIsRecording(true); // Set state AFTER successful start
      console.log("MediaRecorder started.");

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Start transcription if initialized successfully
      if (recognition) {
        try {
          recognition.start();
          setIsTranscribing(true);
          console.log("Speech recognition started.");
        } catch (err) {
          console.error("Failed to start speech recognition:", err);
          setIsTranscribing(false);
          toast({ title: "Transcription Error", description: "Could not start speech recognition.", status: "warning", duration: 3000 });
        }
      }

    } catch (err) {
      console.error("Failed to setup or start MediaRecorder:", err);
      toast({ title: "Recording Failed", description: `Could not start recording: ${err.message}`, status: "error", duration: 5000 });
      cleanupStream(); // Clean up stream if recorder fails
      cleanupRecognition(); // Clean up recognition
      setIsRecording(false); // Ensure recording state is false
    }
  };

  const stopRecording = () => {
    console.log("Stopping recording...");
    // Add this line to ensure interim transcript is included
    setFinalTranscript(prev => prev + interimTranscript);
    // Set state immediately to prevent recognition restarts via onend
    setIsRecording(false);

    // Stop the recorder (this will trigger onstop)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.error("Error stopping MediaRecorder:", err);
        // Manually trigger cleanup if stop fails? Maybe not, onstop might still fire.
      }
    } else {
       console.log("MediaRecorder not recording or already stopped.");
       // If recorder wasn't running, ensure recognition is stopped manually
       cleanupRecognition();
       clearInterval(timerRef.current);
       timerRef.current = null;
    }
    // Note: cleanupRecognition() is called within mediaRecorder.onstop
    // And stream cleanup happens either on new recording start or component unmount
  };

  // Format time for display (MM:SS)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  // Submit recording to server
  const submitRecording = async () => {
    if (!recordedBlob || !challenge) return;
    
    setIsSubmitting(true);
    setUploadProgress(0);
    
    // Create a complete transcript that includes both final and any remaining interim content
    const completeTranscript = finalTranscript;
    
    try {
      const speechMetrics = calculateSpeechMetrics(completeTranscript, recordingTime, transcriptTimestamps);
      
      const fileName = `pitch_${id}_${Date.now()}.webm`;
      const videoFile = new File([recordedBlob], fileName, { type: 'video/webm' });
      
      const formData = new FormData();
      formData.append('video', videoFile);
      formData.append('challengeId', id);
      if (assignmentId) formData.append('assignmentId', assignmentId); // Only include if present
      formData.append('transcript', completeTranscript); // Send complete transcript
      
      // Add speech metrics
      formData.append('averageSpeechRate', speechMetrics.averageSpeechRate);
      formData.append('conversationalSpeechRate', speechMetrics.conversationalSpeechRate);
      formData.append('longPauses', speechMetrics.longPauses);
      formData.append('speakingTimePercent', speechMetrics.speakingTimePercent);
      formData.append('pauseDurations', JSON.stringify(speechMetrics.pauseDurations || []));
      
      console.log("Submitting pitch...");
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/submissions`,
        formData,
        {
          headers: { 'x-auth-token': token, 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
          }
        }
      );
      
      if (response.status === 201) {
        cleanupStream(); // Clean up stream after successful submission
        toast({ title: "Success", description: "Pitch submitted!", status: "success", duration: 3000 });
        navigate(`/assignments/${assignmentId}/new`); // Navigate back
      } else {
         // Handle non-201 success codes if necessary
         console.warn("Submission response status:", response.status);
         toast({ title: "Submission Notice", description: "Received unexpected status from server.", status: "warning", duration: 5000 });
      }
    } catch (err) {
      console.error("Error submitting recording:", err.response || err);
      toast({
        title: "Submission Failed",
        description: err.response?.data?.message || "Could not submit pitch. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle exiting the challenge
  const handleExit = () => {
    onClose(); // Close the dialog first
    if (isRecordingRef.current) {
      stopRecording(); // Stop recording if active
    }
    cleanupStream(); // Clean up media stream
    cleanupRecognition(); // Clean up recognition instance
    
    // Navigate back
    if (assignmentId) {
      navigate(`/assignments/${assignmentId}/new`);
    } else {
      navigate('/challenges');
    }
  };
  
  // Clean up resources on component unmount
  useEffect(() => {
    return () => {
      console.log("ChallengeAttempt unmounting - cleaning up resources...");
      if (timerRef.current) clearInterval(timerRef.current);
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
      // Ensure recorder is stopped if component unmounts while recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
         try { mediaRecorderRef.current.stop(); } catch(e) {}
      }
      cleanupRecognition();
      cleanupStream();
    };
  }, [cleanupRecognition]); // Add cleanupRecognition dependency

  // Utility to clean up the media stream
  const cleanupStream = () => {
    if (streamRef.current) {
      console.log("Cleaning up media stream tracks.");
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
      // Also clear video element source if needed
      if (videoRef.current) {
         videoRef.current.srcObject = null;
         videoRef.current.src = '';
      }
    }
  };

  // Show hints based on prop
  useEffect(() => {
    setShowHints(!!enableHints); // Set based on boolean value
  }, [enableHints]);

  // --- Speech Metrics Calculation (largely unchanged, ensure it uses finalTranscript) ---
  const calculateSpeechMetrics = (transcriptToAnalyze, durationSeconds, timestampData = []) => {
    // Use the provided transcript (should be finalTranscript)
    if (!transcriptToAnalyze || transcriptToAnalyze.trim() === '' || !durationSeconds || durationSeconds <= 0) {
      return { averageSpeechRate: 0, conversationalSpeechRate: 0, longPauses: 0, pauseDurations: [], speakingTimePercent: 0 };
    }
    
    const words = transcriptToAnalyze.trim().split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;
    const durationMinutes = durationSeconds / 60;
    const averageSpeechRate = Math.round(wordCount / durationMinutes);
    
    const hasTimestamps = timestampData && timestampData.length > 0;
    
    if (hasTimestamps) {
      return calculateWithTimestamps(words, timestampData, durationSeconds);
    } else {
      // Fallback estimation might be less useful now, but kept for completeness
      console.warn("Calculating speech metrics without precise timestamps.");
      return calculateWithEstimation(words, durationSeconds, averageSpeechRate);
    }
  };

  const calculateWithTimestamps = (words, timestampData, durationSeconds) => {
    const wordCount = words.length; // Use passed-in words array
    const averageSpeechRate = durationSeconds > 0 ? Math.round(wordCount / (durationSeconds / 60)) : 0;

    const sortedEvents = [...timestampData].sort((a, b) => a.timeStart - b.timeStart);
    
    const speakingSegments = [];
    const pauseDurations = [];
    let lastEndTime = 0;
    
    // Initial silence
    if (sortedEvents.length > 0 && sortedEvents[0].timeStart > 1.0) {
      pauseDurations.push(sortedEvents[0].timeStart);
    }
    
    for (let i = 0; i < sortedEvents.length; i++) {
      const event = sortedEvents[i];
      const gap = event.timeStart - lastEndTime;
      // Consider pauses longer than 300ms
      if (lastEndTime > 0 && gap > 0.3) {
        pauseDurations.push(gap);
      }
      
      const segmentWordCount = event.words.split(/\s+/).filter(w => w.length > 0).length;
      const duration = Math.max(0.1, event.timeEnd - event.timeStart); // Avoid division by zero

      speakingSegments.push({
        duration: duration,
        wordCount: segmentWordCount,
      });
      
      lastEndTime = event.timeEnd;
    }
    
    // Final silence
    if (sortedEvents.length > 0 && (durationSeconds - lastEndTime) > 1.0) {
      pauseDurations.push(durationSeconds - lastEndTime);
    }
    
    const totalSpeakingTime = speakingSegments.reduce((sum, segment) => sum + segment.duration, 0);
    const totalSpeakingWords = speakingSegments.reduce((sum, segment) => sum + segment.wordCount, 0);
    
    const conversationalSpeechRate = totalSpeakingTime > 0 ? 
      Math.round(totalSpeakingWords / (totalSpeakingTime / 60)) : 
      averageSpeechRate; // Fallback if no speaking time calculated
      
    const longPauses = pauseDurations.filter(d => d >= 2).length; // Pauses >= 2 seconds
    const speakingTimePercent = durationSeconds > 0 ? Math.round((totalSpeakingTime / durationSeconds) * 100) : 0;

    return {
      averageSpeechRate: Math.min(averageSpeechRate, 500), // Cap rates
      conversationalSpeechRate: Math.min(conversationalSpeechRate, 500),
      longPauses,
      pauseDurations: pauseDurations.filter(duration => duration >= 1), // Report pauses >= 1s
      speakingTimePercent: Math.min(speakingTimePercent, 100)
    };
  };

  const calculateWithEstimation = (words, durationSeconds, averageSpeechRate) => {
     // Basic estimation if timestamps fail
     const estimatedSpeakingTime = (words.length * 60) / 150; // Assume ~150 WPM conversational rate
     const speakingTimePercent = Math.min(100, Math.round((estimatedSpeakingTime / durationSeconds) * 100));
     const estimatedPauseTime = durationSeconds - estimatedSpeakingTime;
     const longPauses = estimatedPauseTime > 0 ? Math.floor(estimatedPauseTime / 3) : 0; // Guess based on 3s pauses

     return {
       averageSpeechRate,
       conversationalSpeechRate: averageSpeechRate > 0 ? 150 : 0, // Fixed estimate
       longPauses: Math.max(0, longPauses),
       pauseDurations: [],
       speakingTimePercent: Math.max(0, speakingTimePercent)
     };
  };


  // --- Render Logic ---

  if (loading) {
    return (
      <Center height="80vh">
        <VStack spacing={4}>
          <Spinner size="xl" thickness="4px" color="brand.500" />
          <Text>Loading challenge...</Text>
        </VStack>
      </Center>
    );
  }

  // Ensure challenge data is available before rendering main UI
  if (!challenge) {
     return (
       <Center height="80vh">
         <VStack spacing={4}>
           <Icon as={FaExclamationCircle} w={10} h={10} color="red.500" />
           <Text>Failed to load challenge data.</Text>
           <Button onClick={() => navigate('/challenges')}>Go Back</Button>
         </VStack>
       </Center>
     );
  }

  return (
    <Container maxW="container.xl" py={4} position="relative" height="calc(100vh - 80px)">
      {/* Back button */}
      <IconButton
        icon={<FaArrowLeft />}
        aria-label="Go back"
        position="absolute"
        left={4}
        top={4}
        onClick={onOpen} // Opens confirmation dialog
        size="md"
        colorScheme="gray"
        variant="ghost"
      />

      {/* Header Section */}
      <VStack spacing={2} mb={4} align="center" pt={4}>
        <Heading size="lg" textAlign="center">{challenge.name}</Heading>
        <Text fontSize="md" color="gray.500" textAlign="center">{challenge.description}</Text>
        
        {progress.total > 0 && (
          <HStack mt={2}>
            <Text fontSize="sm" fontWeight="bold">
              Challenge {progress.current + 1} of {progress.total}
              {progress.isCurrentChallengeCompleted && (
                <Badge ml={2} colorScheme="green">Reattempt</Badge>
              )}
            </Text>
            <Progress 
              value={(progress.completed / progress.total) * 100}
              size="sm" 
              colorScheme="brand" 
              borderRadius="full"
              width="100px"
            />
          </HStack>
        )}
      </VStack>

      {/* Main Content */}
      <Flex 
        direction={{ base: "column", md: "row" }} 
        h={{ base: "auto", md: "calc(100vh - 200px)" }} // Adjust height calculation if needed
        gap={4}
      >
        {/* Video Section */}
        <Box 
          flex={{ base: "1", md: "0.65" }}
          bg="black"
          borderRadius="md"
          overflow="hidden"
          position="relative"
          height={{ base: "350px", md: "auto" }} // Responsive height
        >
          <video 
            ref={videoRef} 
            style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: '#000' }} 
            playsInline // Important for mobile
            // autoPlay and muted are handled dynamically
          />
          
          {/* Countdown Overlay */}
          {countdown !== null && (
            <Center position="absolute" inset="0" bg={countdownBg} borderRadius="md">
              <Heading size="4xl" color={countdownTextColor}>{countdown}</Heading>
            </Center>
          )}
          
          {/* Initial State Overlay */}
          {!isRecording && !recordedBlob && countdown === null && (
            <Center position="absolute" inset="0" bg="blackAlpha.700" borderRadius="md">
              <VStack spacing={4}>
                <Icon as={FaPlay} w={12} h={12} color="gray.200" />
                <Text color="white" fontWeight="medium">Click Record to start</Text>
              </VStack>
            </Center>
          )}

          {/* Recording Timer Display */}
          {isRecording && (
            <HStack 
              position="absolute" top={4} right={4} bg="blackAlpha.700"
              color="white" px={3} py={1} borderRadius="full" spacing={2}
            >
              <Icon as={FaMicrophone} color="red.400" className={isRecording ? "pulse" : ""} />
              <Text>{formatTime(recordingTime)}</Text>
            </HStack>
          )}
        </Box>

        {/* Right Panel */}
        <VStack 
          flex={{ base: "1", md: "0.35" }}
          spacing={4}
          align="stretch"
          h="full" // Allow vertical stack to take full height
          overflowY="auto" // Allow scrolling if content overflows
        >
          {/* Hints Section */}
          {enableHints && (
            <Box>
              <HStack 
                justify="space-between" mb={2} onClick={() => setShowHints(!showHints)} 
                cursor="pointer" bg={bgColor} p={3} borderRadius="md" shadow="sm"
              >
                <HStack>
                  <Icon as={FaLightbulb} color="yellow.400" />
                  <Heading size="sm">Pitch Hints</Heading>
                </HStack>
                <Icon as={showHints ? FaChevronDown : FaChevronRight} />
              </HStack>
              
              <Collapse in={showHints} animateOpacity>
                <Box 
                  p={4} bg={bgColor} borderRadius="md" shadow="sm"
                  borderWidth={1} borderColor={borderColor}
                  maxH="250px" overflowY="auto" // Scrollable hints
                >
                  {challenge.evaluationCriteria?.length > 0 ? (
                    <List spacing={3}>
                      {challenge.evaluationCriteria.map((criteria, index) => (
                        <ListItem 
                          key={index} p={3} borderRadius="md"
                          borderLeftWidth="4px"
                          borderLeftColor={criteria.weight > 0 ? "green.400" : "red.400"}
                          bg={criteria.weight > 0 ? "green.50" : "red.50"}
                          _dark={{ bg: criteria.weight > 0 ? "green.800" : "red.800" }} // Dark mode bg
                        >
                          <HStack align="flex-start" spacing={3}>
                            <Icon 
                              as={criteria.weight > 0 ? FaCheckCircle : FaExclamationCircle} 
                              color={criteria.weight > 0 ? "green.500" : "red.500"} 
                              boxSize={5} mt={1} // Align icon better
                            />
                            <Box>
                              <Tooltip 
                                label={criteria.weight > 0 ? "Include this" : "Avoid this"}
                                placement="top" hasArrow
                              >
                                <Badge 
                                  mb={1} colorScheme={criteria.weight > 0 ? "green" : "red"} 
                                  variant="subtle" px={2} py={0.5} borderRadius="full"
                                >
                                  {criteria.weight > 0 ? "INCLUDE" : "AVOID"}
                                </Badge>
                              </Tooltip>
                              <Text fontSize="sm">{criteria.keyword}</Text>
                            </Box>
                          </HStack>
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Text color="gray.500" textAlign="center">No specific hints available.</Text>
                  )}
                </Box>
              </Collapse>
            </Box>
          )}

          {/* Transcription Section */}
          <Box
            flex="1" // Take remaining space
            bg={bgColor} p={4} borderRadius="md" shadow="sm"
            borderWidth={1} borderColor={borderColor}
            display="flex" flexDirection="column"
            minH={{ base: "200px", md: "300px" }} // Ensure minimum height
          >
            <HStack mb={2} justify="space-between">
              <Heading size="sm">Live Transcription</Heading>
              <HStack>
                <Icon as={FaMicrophone} color={isTranscribing ? "red.400" : "gray.400"} />
                <Badge colorScheme={isTranscribing ? "green" : "gray"} variant="solid">
                  {isTranscribing ? "Active" : "Inactive"}
                </Badge>
                <Tooltip label="Restart Transcription" placement="top" hasArrow>
                  <IconButton
                    icon={<FaRedo />}
                    aria-label="Restart transcription"
                    size="sm"
                    variant="ghost"
                    // Enable only if recording started, even if currently inactive
                    isDisabled={!isRecording && !recordedBlob}
                    onClick={restartTranscription}
                    ml={1}
                  />
                </Tooltip>
              </HStack>
            </HStack>
            <Divider mb={2} />
            <Box
              ref={transcriptContainerRef}
              flex="1" // Allow text area to grow
              overflowY="auto"
              sx={{ /* Scrollbar styles */ }}
              pb={2} // Padding at bottom
            >
              {transcript ? (
                <Text whiteSpace="pre-wrap" fontSize="sm">
                  {/* Display final and interim transcript */}
                  <span style={{ color: finalTranscriptColor }}>{finalTranscript}</span>
                  <span style={{ color: interimTranscriptColor }}>{interimTranscript}</span>
                </Text>
              ) : (
                <Text color="gray.500" fontSize="sm" fontStyle="italic">
                  {isRecording
                    ? "Speak clearly. Transcription appears here..."
                    : "Transcription starts with recording."
                  }
                </Text>
              )}
            </Box>
          </Box>
        </VStack>
      </Flex>

      {/* Action Buttons */}
      <HStack justify="center" mt={6} spacing={4}>
        {!isRecording && !recordedBlob && (
          <Button
            leftIcon={<FaPlay />} colorScheme="red" size="lg"
            borderRadius="full" px={8} onClick={startRecording}
            isDisabled={!assignmentActive || isSubmitting || loading} // Disable if assignment inactive or submitting/loading
            title={!assignmentActive ? "Assignment is not active" : "Start Recording"}
          >
            Record Pitch
          </Button>
        )}

        {isRecording && (
          <Button
            leftIcon={<FaStop />} colorScheme="red" size="lg"
            borderRadius="full" px={8} onClick={stopRecording}
            isDisabled={isSubmitting} // Disable if submitting
          >
            Stop Recording
          </Button>
        )}

        {recordedBlob && !isRecording && ( // Show only when recording stopped and blob exists
          <HStack spacing={4}>
            <Button
              leftIcon={<FaPlay />} colorScheme="blue" size="lg"
              onClick={startRecording} // Re-record clears the blob
              isDisabled={!assignmentActive || isSubmitting}
              title={!assignmentActive ? "Assignment is not active" : "Record Again"}
            >
              Record Again
            </Button>
            <Button
              leftIcon={<FaCheckCircle />} colorScheme="brand" size="lg"
              onClick={submitRecording}
              isLoading={isSubmitting}
              loadingText={`Uploading ${uploadProgress}%`}
              isDisabled={!assignmentActive || isSubmitting} // Disable if assignment inactive or already submitting
              title={!assignmentActive ? "Assignment is not active" : "Submit Pitch"}
            >
              Submit Pitch
            </Button>
          </HStack>
        )}
      </HStack>

      {/* Upload Progress */}
      {isSubmitting && (
        <Box mt={4} px={4}>
          <Text textAlign="center" mb={1} fontSize="sm">Uploading: {uploadProgress}%</Text>
          <Progress value={uploadProgress} size="xs" colorScheme="brand" borderRadius="full" />
        </Box>
      )}

      {/* Exit Confirmation Dialog */}
      <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose} isCentered>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">Exit Challenge</AlertDialogHeader>
            <AlertDialogBody>
              {isRecording ? "Stop recording and exit? Progress will be lost." :
               recordedBlob ? "Exit without submitting? Your recording will be discarded." :
               "Are you sure you want to leave this challenge?"}
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>Cancel</Button>
              <Button colorScheme="red" onClick={handleExit} ml={3}>Exit</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Pulse Animation Style */}
      <style jsx="true">{`
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
        .pulse { animation: pulse 1.5s infinite; }
      `}</style>
    </Container>
  );
};

export default ChallengeAttempt;