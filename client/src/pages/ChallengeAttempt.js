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
  const lastActivityTimerRef = useRef(null);
  const lastTranscriptUpdateRef = useRef(Date.now());

  // Alert dialog for exit confirmation
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef();
  
  // Color mode values - define these at the top level, not inside conditionals
  const bgColor = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const countdownBg = useColorModeValue("rgba(255,255,255,0.7)", "rgba(45,55,72,0.7)");
  const countdownTextColor = useColorModeValue("brand.600", "brand.300");

  // Fetch challenge data
  useEffect(() => {
    const fetchChallenge = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/challenges/${id}`,
          {
            headers: { "x-auth-token": token },
          }
        );
        setChallenge(res.data);
        
        // Also fetch progress if assignment ID is available
        if (assignmentId) {
          try {
            const progressRes = await axios.get(
              `${process.env.REACT_APP_API_URL}/api/assignments/${assignmentId}/progress`,
              { headers: { "x-auth-token": token } }
            );
            
            // Check if current challenge is in completed challenges
            const currentChallengeCompleted = progressRes.data.completedChallengeIds.includes(id);
            
            // Get index of current challenge in the challenges array
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
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch challenge:", err);
        toast({
          title: "Error",
          description: "Failed to fetch challenge details",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        setLoading(false);
      }
    };

    fetchChallenge();
  }, [id, token, assignmentId, toast]);

  // Initialize speech recognition
  const initializeSpeechRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      toast({
        title: "Browser Not Supported",
        description: "Your browser doesn't support speech recognition",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      
      // Add confirmation dialog
      if (window.confirm("Your browser doesn't support speech recognition. Would you like to use the alternative submission method?")) {
        navigate(`/challenges/${challenge?._id}`, {
          state: {
            assignmentId: assignmentId,
            assignmentActive: assignmentActive,
            enableHints: enableHints,
          },
        });
      }
      
      return false;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';
    
    // Track start time of recognition
    const recognitionStartTime = Date.now() / 1000;
    
    // Track appearance timestamps for interim results
    const interimStartTimes = new Map();
    let currentInterimId = 0;
    
    // Add state for tracking last activity time
    const lastActivityRef = { current: Date.now() };
    let restartAttempts = 0;
    const MAX_RESTART_ATTEMPTS = 5;
    let inactivityTimer = null;

    recognition.onresult = (event) => {
      // Reset inactivity tracking on new results
      lastActivityRef.current = Date.now();
      restartAttempts = 0;
      
      let currentInterim = '';
      let newFinal = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        const resultId = `${i}-${currentInterimId}`;
        
        // Track interim result start times
        if (!interimStartTimes.has(resultId)) {
          interimStartTimes.set(resultId, Date.now() / 1000 - recognitionStartTime);
        }
        
        if (event.results[i].isFinal) {
          newFinal += transcript + ' ';
          
          // Only add timestamp once with the more accurate timing
          const startTime = interimStartTimes.get(resultId) || (Date.now() / 1000 - recognitionStartTime - 1);
          const endTime = Date.now() / 1000 - recognitionStartTime;
          
          setTranscriptTimestamps(prev => [
            ...prev,
            {
              words: transcript,
              timeStart: startTime, 
              timeEnd: endTime
            }
          ]);
          
          // Clean up the map
          interimStartTimes.delete(resultId);
          currentInterimId++;
        } else {
          currentInterim += transcript;
        }
      }
      
      // Use functional updates to avoid state closure issues
      setFinalTranscript(prevFinal => {
        const updatedFinal = newFinal ? prevFinal + newFinal : prevFinal;
        
        // Use batch updates pattern
        setInterimTranscript(currentInterim);
        setTranscript(updatedFinal + currentInterim);
        
        return updatedFinal;
      });
      
      // Auto-scroll to bottom
      if (transcriptContainerRef.current) {
        transcriptContainerRef.current.scrollTop = transcriptContainerRef.current.scrollHeight;
      }
    };
    
    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      
      // Enhanced error handling for different error types
      switch(event.error) {
        case 'not-allowed':
          toast({
            title: "Microphone Access Denied",
            description: "Please allow microphone access for transcription",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
          break;
        
        case 'network':
          toast({
            title: "Network Error",
            description: "Speech recognition service is unavailable",
            status: "warning",
            duration: 3000,
            isClosable: true,
          });
          break;
          
        case 'no-speech':
          console.log("No speech detected, continuing...");
          // This is fairly normal, no need to alert the user
          break;
          
        case 'audio-capture':
          toast({
            title: "Audio System Error",
            description: "There's a problem with your microphone",
            status: "warning",
            duration: 3000,
            isClosable: true,
          });
          break;
          
        case 'aborted':
          // Only show if not caused by our own code
          if (restartAttempts === 0) {
            console.log("Recognition was aborted");
          }
          break;
          
        default:
          console.log(`Unhandled speech recognition error: ${event.error}`);
      }
    };
    
    recognition.onend = () => {
      clearTimeout(inactivityTimer);
      
      // Check both isRecording AND isTranscribing 
      if (isRecording && isTranscribing) {
        // Increment restart attempt counter
        restartAttempts++;
        
        // Use progressively longer delays for restart attempts
        const delayMs = Math.min(300 * Math.pow(1.5, restartAttempts - 1), 2000);
        
        // Limit maximum restart attempts
        if (restartAttempts <= MAX_RESTART_ATTEMPTS) {
          console.log(`Restarting speech recognition (attempt ${restartAttempts}/${MAX_RESTART_ATTEMPTS}) after ${delayMs}ms`);
          
          setTimeout(() => {
            try {
              recognition.start();
            } catch (err) {
              console.error(`Failed to restart speech recognition (attempt ${restartAttempts}):`, err);
              
              // If we've reached maximum attempts, stop trying
              if (restartAttempts >= MAX_RESTART_ATTEMPTS) {
                console.error("Maximum restart attempts reached. Giving up.");
                setIsTranscribing(false);
                
                toast({
                  title: "Transcription Error",
                  description: "Speech recognition failed to restart. Try refreshing the page.",
                  status: "error",
                  duration: 5000,
                  isClosable: true,
                });
              }
            }
          }, delayMs);
        } else {
          setIsTranscribing(false);
        }
      }
    };
    
    // Add inactivity detection
    inactivityTimer = setInterval(() => {
      // If no transcription activity for 8 seconds while recording
      if (isRecording && Date.now() - lastActivityRef.current > 3000) {
        console.log("Detected inactive transcription, attempting to restart");
        try {
          recognition.stop();
          // onend handler will restart it
        } catch (err) {
          console.error("Error stopping inactive recognition:", err);
        }
        lastActivityRef.current = Date.now(); // Reset to avoid multiple restarts
      }
    }, 4000); // Check every 4 seconds
    
    recognitionRef.current = recognition;
    return { recognition, lastActivityRef, inactivityTimer };
  }, [toast, navigate, challenge?._id, assignmentId, assignmentActive, enableHints, isRecording]);

  // Add this as a separate function in your component
  const restartTranscription = useCallback(async () => {
    console.log("Attempting to restart transcription...");
    
    // First, clean up existing recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error("Error stopping stalled recognition:", err);
      }
      
      // Set a flag to indicate we're in restart process
      const isRestartingTranscription = true;
      
      // Small delay to let browser clean up resources
      setTimeout(async () => {
        try {
          // Create new recognition instance rather than reusing
          const newRecognition = initializeSpeechRecognition();
          
          if (newRecognition) {
            // Visual feedback that we're restarting
            toast({
              title: "Restarting transcription",
              description: "Speech recognition is being restarted",
              status: "info",
              duration: 2000,
              isClosable: true,
            });
            
            try {
              newRecognition.recognition.start();
              console.log("Successfully started new recognition instance");
              setIsTranscribing(true);
            } catch (err) {
              console.error("Failed to start new recognition instance:", err);
              setIsTranscribing(false);
              
              // Show user a manual restart option
              toast({
                title: "Transcription Error",
                description: "Speech recognition failed to restart automatically. Tap the microphone icon to resume.",
                status: "warning",
                duration: 5000,
                isClosable: true,
              });
            }
          }
        } catch (err) {
          console.error("Error in restart process:", err);
          setIsTranscribing(false);
        }
      }, 800); // Longer delay to ensure proper cleanup
    }
  }, [initializeSpeechRecognition, toast]);

  // Start recording process
  const startRecording = async () => {
    try {
      // Reset any previous recording state
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      setRecordedBlob(null);
      
      // Request camera and microphone permissions with specific constraints
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true
        }
      });
      
      // Set up video preview
      if (videoRef.current) {
        videoRef.current.srcObject = streamRef.current;
        await videoRef.current.play().catch(err => {
          console.error("Error playing video:", err);
        });
      }
      
      // Initialize speech recognition
      const recognitionAvailable = initializeSpeechRecognition();
      
      // Start countdown
      setCountdown(3);
      let count = 3;
      
      const countdownInterval = setInterval(() => {
        count--;
        setCountdown(count);
        
        if (count === 0) {
          clearInterval(countdownInterval);
          
          // After countdown, start actual recording
          setTimeout(() => {
            setCountdown(null);
            beginRecording(recognitionAvailable);
          }, 1000);
        }
      }, 1000);
      
    } catch (err) {
      console.error("Error accessing media devices:", err);
      toast({
        title: "Camera Access Denied",
        description: "Please allow camera and microphone access to record your pitch",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Begin actual recording after countdown
  const beginRecording = (recognitionAvailable) => {
    if (!streamRef.current) {
      console.error("Stream is not available when beginning recording");
      toast({
        title: "Recording Failed",
        description: "Could not access camera. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    // Double check that the stream is active and has tracks
    const videoTrack = streamRef.current.getVideoTracks()[0];
    const audioTrack = streamRef.current.getAudioTracks()[0];
    
    console.log("Checking stream tracks:", {
      videoTrack: videoTrack?.readyState,
      audioTrack: audioTrack?.readyState
    });
    
    // FIXED: The condition had incorrect comparison operators
    // Change from: !videoTrack || !videoTrack.readyState !== 'live' || !audioTrack || !audioTrack.readyState !== 'live'
    // To: !videoTrack || videoTrack.readyState !== 'live' || !audioTrack || audioTrack.readyState !== 'live'
    // Notice the removal of the extra ! before the .readyState checks
    
    if (!videoTrack || videoTrack.readyState !== 'live' || !audioTrack || audioTrack.readyState !== 'live') {
      console.error("Stream tracks are not active:", {
        videoTrack: videoTrack?.readyState,
        audioTrack: audioTrack?.readyState
      });
      toast({
        title: "Stream Error",
        description: "Camera or microphone stream is not active. Please refresh and try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    // Clear previous recording data
    chunksRef.current = [];
    setRecordingTime(0);

    // Only reset transcript when starting a completely new recording
    // (not during auto-restarts by the recognition service)
    if (!isRecording) {
      setTranscript("");
      setFinalTranscript(""); 
      setInterimTranscript("");
      setTranscriptTimestamps([]);
    }
    
    console.log("Setting up MediaRecorder...");
    
    try {
      // Use a simpler, more widely supported configuration
      const options = { mimeType: 'video/webm' };
      
      // Create the recorder with selected options
      mediaRecorderRef.current = new MediaRecorder(streamRef.current, options);
      console.log("MediaRecorder created with options:", options);
      
      // Set up data collection - use frequent timeslices to avoid missing data
      mediaRecorderRef.current.ondataavailable = (e) => {
        // console.log("Data available, chunk size:", e.data?.size);
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      // When recording is stopped
      mediaRecorderRef.current.onstop = () => {
        console.log("MediaRecorder stopped, collected chunks:", chunksRef.current.length);
        
        if (chunksRef.current.length === 0) {
          console.error("No data was collected during recording");
          toast({
            title: "Recording Failed",
            description: "No video data was captured. Please try again.",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
          return;
        }
        
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setRecordedBlob(blob);
        
        // Create object URL for review (optional)
        const videoURL = URL.createObjectURL(blob);
        if (videoRef.current) {
          videoRef.current.srcObject = null;
          videoRef.current.src = videoURL;
          videoRef.current.controls = true;
        }
        
        // Stop transcription
        if (recognitionRef.current) {
          recognitionRef.current.stop();
          setIsTranscribing(false);
        }
        
        // Reset UI
        setIsRecording(false);
        clearInterval(timerRef.current);
      };
      
      // Handle errors during recording
      mediaRecorderRef.current.onerror = (event) => {
        console.error("MediaRecorder error during recording:", event);
        toast({
          title: "Recording Error",
          description: "An error occurred while recording. Please try again.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      };
      
      console.log("Starting MediaRecorder...");
      
      // Start recording with a smaller timeslice (more frequent data collection)
      mediaRecorderRef.current.start(200);
      setIsRecording(true);
      console.log("MediaRecorder started successfully");
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      // Start transcription if available
      if (recognitionAvailable) {
        setIsTranscribing(true);
        const { recognition, lastActivityRef } = recognitionAvailable;
        
        // Store last activity ref for monitoring - use existing ref instead of creating new one
        lastActivityTimerRef.current = lastActivityRef;
        
        try {
          recognition.start();
        } catch (err) {
          console.error("Failed to start speech recognition:", err);
          setIsTranscribing(false);
          
          toast({
            title: "Transcription Error",
            description: "Could not start speech recognition. Your transcript may be incomplete.",
            status: "warning",
            duration: 5000,
            isClosable: true,
          });
        }
      }
    } catch (err) {
      console.error("Failed to start recording:", err);
      toast({
        title: "Recording Failed",
        description: "Could not start recording: " + (err.message || "Unknown error"),
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const stopRecording = () => {
    console.log("Stopping recording...");
    
    // Immediately set state to prevent recognition restart
    setIsRecording(false);
    setIsTranscribing(false);
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      try {
        mediaRecorderRef.current.stop();
        console.log("MediaRecorder stopped");
      } catch (err) {
        console.error("Error stopping MediaRecorder:", err);
      }
    } else {
      console.log("MediaRecorder not in recording state:", mediaRecorderRef.current?.state);
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        console.log("Speech recognition stopped");
      } catch (err) {
        console.error("Error stopping speech recognition:", err);
      }
    }
    
    clearInterval(timerRef.current);
    
    // Don't stop the stream yet - keep it for preview until submit or re-record
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
    
    try {
      // Calculate speech metrics using timestamps
      const speechMetrics = calculateSpeechMetrics(transcript, recordingTime, transcriptTimestamps);
      
      // Create a file from blob
      const fileName = `pitch_${id}_${Date.now()}.webm`;
      const videoFile = new File([recordedBlob], fileName, { type: 'video/webm' });
      
      const formData = new FormData();
      formData.append('video', videoFile);
      formData.append('challengeId', id);
      formData.append('assignmentId', assignmentId);
      formData.append('transcript', transcript);
      
      // Add speech metrics to the form data
      formData.append('averageSpeechRate', speechMetrics.averageSpeechRate);
      formData.append('conversationalSpeechRate', speechMetrics.conversationalSpeechRate);
      formData.append('longPauses', speechMetrics.longPauses);
      formData.append('speakingTimePercent', speechMetrics.speakingTimePercent);
      // Convert pause durations array to string to send in form data
      if (speechMetrics.pauseDurations && speechMetrics.pauseDurations.length > 0) {
        formData.append('pauseDurations', JSON.stringify(speechMetrics.pauseDurations));
      } else {
        formData.append('pauseDurations', JSON.stringify([]));
      }
      console.log("Submitting form data:", formData);
      console.log("Token:", token.substring(0, 10) + "...");
      console.log("AssignmentId:", assignmentId);
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/submissions`,
        formData,
        {
          headers: { 
            'x-auth-token': token,
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
          }
        }
      );
      
      if (response.status === 201) {
        cleanupStream(); // Add this line
        toast({
          title: "Success",
          description: "Your pitch has been submitted successfully!",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        
        // Navigate back to assignment page
        navigate(`/assignments/${assignmentId}/new`);
      }
    } catch (err) {
      console.error("Error submitting recording:", err);
      toast({
        title: "Submission Failed",
        description: err.response?.data?.message || "Failed to submit your pitch",
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
    // Stop recording if active
    if (isRecording) {
      stopRecording();
    }
    
    // Navigate back to assignment page or challenges list
    if (assignmentId) {
      navigate(`/assignments/${assignmentId}/new`);
    } else {
      navigate('/challenges');
    }
  };
  
  // Clean up resources on component unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        try {
          mediaRecorderRef.current.stop();
        } catch (err) {
          console.error("Error stopping MediaRecorder on cleanup:", err);
        }
      }
      
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {
          console.error("Error stopping speech recognition on cleanup:", err);
        }
      }
      
      cleanupStream();
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      // Clear any remaining inactivity timers
      if (recognitionRef.current && recognitionRef.current.inactivityTimer) {
        clearInterval(recognitionRef.current.inactivityTimer);
      }
    };
  }, []);

  // Add this function to clean up the stream when needed
  const cleanupStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (err) {
          console.error("Error stopping track:", err);
        }
      });
      streamRef.current = null;
    }
  };

  // Add this to your component function
  useEffect(() => {
    if (enableHints) {
      setShowHints(true);
    }
  }, [enableHints]);

  // Calculate speech metrics using transcript timestamps when available
  const calculateSpeechMetrics = (transcript, durationSeconds, timestampData = []) => {
    if (!transcript || transcript.trim() === '' || !durationSeconds || durationSeconds <= 0) {
      return { 
        averageSpeechRate: 0,
        conversationalSpeechRate: 0,
        longPauses: 0,
        pauseDurations: []
      };
    }
    
    // Clean transcript and split into words
    const words = transcript.trim().split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;
    const durationMinutes = durationSeconds / 60;
    
    // Calculate basic average speech rate (words per minute)
    const averageSpeechRate = Math.round(wordCount / durationMinutes);
    
    // Check if we have timestamp data
    const hasTimestamps = timestampData && timestampData.length > 0;
    
    if (hasTimestamps) {
      // Use actual timestamp data for precise calculations
      return calculateWithTimestamps(words, timestampData, durationSeconds);
    } else {
      // Fall back to chunk-based estimation
      return calculateWithEstimation(words, durationSeconds, averageSpeechRate);
    }
  };

  // Calculate metrics using actual timestamps
  const calculateWithTimestamps = (words, timestampData, durationSeconds) => {
    const wordCount = words.length;
    const durationMinutes = durationSeconds / 60;
    const averageSpeechRate = Math.round(wordCount / durationMinutes);
    
    // Sort timestamps chronologically
    const sortedEvents = [...timestampData].sort((a, b) => a.timeStart - b.timeStart);
    
    // Find speaking segments and pauses
    const speakingSegments = [];
    const pauseDurations = [];
    let lastEndTime = 0;
    
    // Account for initial silence
    if (sortedEvents.length > 0 && sortedEvents[0].timeStart > 1.0) {
      pauseDurations.push(sortedEvents[0].timeStart);
    }
    
    // Process all speech segments
    for (let i = 0; i < sortedEvents.length; i++) {
      const event = sortedEvents[i];
      
      // Check for pause between segments
      const gap = event.timeStart - lastEndTime;
      if (lastEndTime > 0 && gap > 0.3) { // Lower threshold to catch more pauses
        pauseDurations.push(gap);
      }
      
      // Check for potential micro-pauses within this segment
      const words = event.words.split(/\s+/).filter(w => w.length > 0);
      const duration = event.timeEnd - event.timeStart;
      
      // If speaking rate within this segment is unusually slow, there might be internal pauses
      const segmentWPM = (words.length / (duration / 60));
      const adjustedDuration = segmentWPM < 100 ? 
        (words.length * 0.3) : // Estimate actual speaking time if very slow
        duration;
      
      speakingSegments.push({
        duration: adjustedDuration,
        wordCount: words.length,
        originalDuration: duration
      });
      
      lastEndTime = event.timeEnd;
    }
    
    // Account for final silence
    if (sortedEvents.length > 0 && 
        (durationSeconds - sortedEvents[sortedEvents.length - 1].timeEnd) > 1.0) {
      pauseDurations.push(durationSeconds - sortedEvents[sortedEvents.length - 1].timeEnd);
    }
    
    // Calculate more accurate speaking time
    const totalSpeakingTime = speakingSegments.reduce((sum, segment) => sum + segment.duration, 0);
    const totalSpeakingWords = speakingSegments.reduce((sum, segment) => sum + segment.wordCount, 0);
    
    // Calculate conversational speech rate (WPM during active speaking)
    const conversationalSpeechRate = totalSpeakingTime > 0 ? 
      Math.round((totalSpeakingWords / (totalSpeakingTime / 60))) : 
      averageSpeechRate;
    
    // Better categorize pauses by duration
    const shortPauses = pauseDurations.filter(d => d >= 0.3 && d < 1).length;
    const mediumPauses = pauseDurations.filter(d => d >= 1 && d < 2).length;
    const longPauses = pauseDurations.filter(d => d >= 2).length;
    
    return {
      averageSpeechRate,
      conversationalSpeechRate: Math.min(conversationalSpeechRate, 300), // Cap at realistic maximum
      longPauses,
      mediumPauses,
      shortPauses,
      totalPauses: pauseDurations.length,
      pauseDurations: pauseDurations.filter(duration => duration >= 1), // Include medium and long pauses
      speakingTimePercent: Math.round((totalSpeakingTime / durationSeconds) * 100)
    };
  };

  // Fallback calculation using estimation
  const calculateWithEstimation = (words, durationSeconds, averageSpeechRate) => {
    // Use sliding window approach to estimate dense speaking segments
    const windowSizes = [6, 10, 15];
    let chunkRates = [];
    
    windowSizes.forEach(windowSize => {
      if (words.length >= windowSize) {
        for (let i = 0; i <= words.length - windowSize; i++) {
          const chunkProportion = windowSize / words.length;
          const estimatedChunkDuration = durationSeconds * chunkProportion;
          const chunkRateWPM = (windowSize / (estimatedChunkDuration / 60));
          
          if (chunkRateWPM > 60 && chunkRateWPM < 300) {
            chunkRates.push(chunkRateWPM);
          }
        }
      }
    });
    
    // Estimate conversational speech rate (75th percentile of chunk rates)
    let conversationalSpeechRate = averageSpeechRate;
    if (chunkRates.length > 0) {
      chunkRates.sort((a, b) => a - b);
      const idx = Math.floor(chunkRates.length * 0.75);
      conversationalSpeechRate = Math.round(chunkRates[idx]);
    }
    
    // Estimate number of long pauses based on rate differential
    const rateDifferential = conversationalSpeechRate / averageSpeechRate;
    const estimatedPauseTime = durationSeconds * (1 - (1 / rateDifferential));
    const estimatedLongPauses = Math.floor(estimatedPauseTime / 3); // Assume average pause is ~3s
    
    return {
      averageSpeechRate,
      conversationalSpeechRate,
      longPauses: Math.max(0, estimatedLongPauses),
      pauseDurations: [],
      speakingTimePercent: Math.min(100, Math.round((100 / rateDifferential)))
    };
  };

  // Monitor transcription status - replace with this improved version
  useEffect(() => {
    let inactivityCheckTimer = null;
    
    if (isRecording && isTranscribing) {
      // Store current transcript value for comparison within the interval
      const currentTranscriptSnapshot = transcript;
      
      // Set initial timestamp
      lastTranscriptUpdateRef.current = Date.now();
      
      inactivityCheckTimer = setInterval(() => {
        const now = Date.now();
        // Check if transcript hasn't changed since interval started
        const transcriptStalled = (now - lastTranscriptUpdateRef.current > 10000) && 
                                 (transcript === currentTranscriptSnapshot);
        
        if (transcriptStalled) {
          console.log("Transcript appears stalled. Attempting to restart recognition.");
          restartTranscription();
          
          // Update timestamp to prevent rapid restarts
          lastTranscriptUpdateRef.current = Date.now();
        }
      }, 7000); // Check less frequently to avoid too many restart attempts
    }
    
    return () => {
      if (inactivityCheckTimer) {
        clearInterval(inactivityCheckTimer);
      }
    };
  }, [isRecording, isTranscribing, transcript, restartTranscription]);

  // Add a separate useEffect to update the lastTranscriptUpdateRef when transcript changes
  useEffect(() => {
    // Update timestamp when transcript changes
    if (isRecording && isTranscribing) {
      lastTranscriptUpdateRef.current = Date.now();
    }
  }, [transcript, isRecording, isTranscribing]);

  // Loading state
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

  return (
    <Container maxW="container.xl" py={4} position="relative" height="calc(100vh - 80px)">
      {/* Back button */}
      <IconButton
        icon={<FaArrowLeft />}
        aria-label="Go back"
        position="absolute"
        left={4}
        top={4}
        onClick={onOpen}
        size="md"
        colorScheme="gray"
        variant="ghost"
      />

      {/* Header Section */}
      <VStack spacing={2} mb={4} align="center" pt={4}>
        <Heading size="lg" textAlign="center">{challenge?.name}</Heading>
        <Text fontSize="md" color="gray.500" textAlign="center">{challenge?.description}</Text>
        
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
        h={{ base: "auto", md: "calc(100vh - 200px)" }}
        gap={4}
      >
        {/* Video Section */}
        <Box 
          flex={{ base: "1", md: "0.65" }}
          bg="black"
          borderRadius="md"
          overflow="hidden"
          position="relative"
          height={{ base: "350px", md: "auto" }}
        >
          <video 
            ref={videoRef} 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'contain',
              backgroundColor: '#000'
            }} 
            autoPlay
            muted
            playsInline
          />
          
          {countdown !== null && (
            <Center 
              position="absolute"
              top="0"
              left="0"
              right="0"
              bottom="0"
              bg={countdownBg}
              borderRadius="md"
            >
              <Heading size="4xl" color={countdownTextColor}>
                {countdown}
              </Heading>
            </Center>
          )}
          
          {!isRecording && !recordedBlob && !countdown && (
            <Center 
              position="absolute"
              top="0"
              left="0"
              right="0"
              bottom="0"
              bg="blackAlpha.700"
              borderRadius="md"
            >
              <VStack spacing={4}>
                <Icon as={FaPlay} w={12} h={12} color="gray.200" />
                <Text color="white" fontWeight="medium">Click Record to start your pitch</Text>
              </VStack>
            </Center>
          )}

          {/* Recording timer display */}
          {isRecording && (
            <HStack 
              position="absolute"
              top={4}
              right={4}
              bg="blackAlpha.700"
              color="white"
              px={3}
              py={1}
              borderRadius="full"
              spacing={2}
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
          h="full"
        >
          {/* Hints Section - only render if enableHints is true */}
          {enableHints && (
            <Box>
              <HStack 
                justify="space-between" 
                mb={2} 
                onClick={() => setShowHints(!showHints)} 
                cursor="pointer"
                bg={bgColor}
                p={3}
                borderRadius="md"
              >
                <HStack>
                  <Icon as={FaLightbulb} color="yellow.400" />
                  <Heading size="sm">Pitch Hints</Heading>
                </HStack>
                <Icon as={showHints ? FaChevronDown : FaChevronRight} />
              </HStack>
              
              <Collapse in={showHints} animateOpacity>
                <Box 
                  p={4} 
                  bg={bgColor} 
                  borderRadius="md" 
                  shadow="sm"
                  borderWidth={1}
                  borderColor={borderColor}
                  maxH="250px"
                  overflowY="auto"
                >
                
                  {challenge?.evaluationCriteria?.length > 0 ? (
                    <List spacing={3}>
                      {challenge.evaluationCriteria.map((criteria, index) => (
                        <ListItem 
                          key={index}
                          p={3}
                          borderRadius="md"
                          borderLeftWidth="4px"
                          borderLeftColor={criteria.weight > 0 ? "green.400" : "red.400"}
                          bg={criteria.weight > 0 ? "green.50" : "red.50"}
                          _dark={{
                            bg: criteria.weight > 0 ? "rgba(74, 222, 128, 0.1)" : "rgba(248, 113, 113, 0.1)"
                          }}
                        >
                          <HStack align="flex-start" spacing={3}>
                            <Icon 
                              as={criteria.weight > 0 ? FaCheckCircle : FaExclamationCircle} 
                              color={criteria.weight > 0 ? "green.500" : "red.500"} 
                              boxSize={5}
                            />
                            <Box>
                              <Tooltip 
                                label={criteria.weight > 0 ? 
                                  "Including this will positively impact your score" : 
                                  "Mentioning this will negatively impact your score"
                                }
                                placement="top"
                              >
                                <Badge 
                                  mb={1}
                                  colorScheme={criteria.weight > 0 ? "green" : "red"} 
                                  variant="subtle"
                                  px={2}
                                  py={0.5}
                                  borderRadius="full"
                                >
                                  {criteria.weight > 0 ? "INCLUDE THIS" : "AVOID THIS"}
                                </Badge>
                              </Tooltip>
                              <Text>{criteria.keyword}</Text>
                            </Box>
                          </HStack>
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Text color="gray.500" textAlign="center">
                      No specific hints available for this challenge.
                    </Text>
                  )}
                </Box>
              </Collapse>
            </Box>
          )}

          {/* Transcription Section */}
          <Box
            flex="1"
            bg={bgColor}
            p={4}
            borderRadius="md"
            shadow="sm"
            borderWidth={1}
            borderColor={borderColor}
            display="flex"
            flexDirection="column"
            h="full"
            minH={{ base: "200px", md: "auto" }}
          >
            <HStack mb={2} justify="space-between">
              <Heading size="sm">Live Transcription</Heading>
              <HStack>
                <Icon as={FaMicrophone} color={isTranscribing ? "red.400" : "gray.400"} />
                <Badge colorScheme={isTranscribing ? "green" : "gray"}>
                  {isTranscribing ? "Active" : "Inactive"}
                </Badge>
                <IconButton
                  icon={<FaRedo />}
                  aria-label="Restart transcription"
                  size="sm"
                  isDisabled={!isRecording || !isTranscribing}
                  onClick={restartTranscription}
                  ml={2}
                />
              </HStack>
            </HStack>
            <Divider mb={2} />
            <Box
              ref={transcriptContainerRef}
              flex="1"
              overflowY="auto"
              sx={{
                '&::-webkit-scrollbar': {
                  width: '6px',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: 'rgba(0,0,0,0.2)',
                  borderRadius: '3px',
                },
              }}
            >
              {transcript ? (
                <Text whiteSpace="pre-wrap">
                  {transcript}
                </Text>
              ) : (
                <Text color="gray.500" fontSize="sm" fontStyle="italic">
                  {isTranscribing 
                    ? "Speak clearly into your microphone. Transcription will appear here..."
                    : "Transcription will begin when you start recording"
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
            leftIcon={<FaPlay />}
            colorScheme="red"
            size="lg"
            borderRadius="full"
            px={8}
            onClick={startRecording}
            isDisabled={!assignmentActive}
          >
            Record Pitch
          </Button>
        )}

        {isRecording && (
          <Button
            leftIcon={<FaStop />}
            colorScheme="red"
            size="lg"
            borderRadius="full"
            px={8}
            onClick={stopRecording}
          >
            Stop Recording
          </Button>
        )}

        {recordedBlob && (
          <HStack spacing={4}>
            <Button
              leftIcon={<FaPlay />}
              colorScheme="blue"
              size="lg"
              onClick={startRecording}
            >
              Record Again
            </Button>
            <Button
              leftIcon={<FaCheckCircle />}
              colorScheme="brand"
              size="lg"
              onClick={submitRecording}
              isLoading={isSubmitting}
              loadingText={`Uploading ${uploadProgress}%`}
            >
              Submit Pitch
            </Button>
          </HStack>
        )}
      </HStack>

      {/* Upload Progress */}
      {isSubmitting && (
        <Box mt={4}>
          <Text textAlign="center" mb={2}>Uploading: {uploadProgress}%</Text>
          <Progress 
            value={uploadProgress} 
            size="sm" 
            colorScheme="brand" 
            borderRadius="full"
          />
        </Box>
      )}

      {/* Exit Challenge Confirmation Dialog */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Exit Challenge
            </AlertDialogHeader>

            <AlertDialogBody>
              {isRecording 
                ? "Your recording will be lost. Are you sure you want to exit?" 
                : recordedBlob 
                  ? "Your recorded pitch will not be submitted. Are you sure?" 
                  : "Are you sure you want to exit this challenge?"
              }
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleExit} ml={3}>
                Exit
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Add some styling for recording indicator */}
      <style jsx="true">{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        .pulse {
          animation: pulse 1.5s infinite;
        }
      `}</style>
    </Container>
  );
};

export default ChallengeAttempt;