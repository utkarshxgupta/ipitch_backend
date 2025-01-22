import React, { useState, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/authContext";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Heading,
  useToast,
  Text,
  Progress,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";

const SubmissionForm = ({ challengeId, assignmentId }) => {
  const { token } = useContext(AuthContext);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const toast = useToast();
  const navigate = useNavigate();

  const validateFile = (file) => {
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB to match server
    const ALLOWED_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

    if (!file) {
      throw new Error('Please select a video file');
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Invalid file type. Please upload MP4, WebM, or MOV files only.');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File is too large. Maximum size is 50MB.');
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    setUploadProgress(0);
    
    try {
      validateFile(file);

      const formData = new FormData();
      formData.append('video', file); // Changed from 'file' to 'video' to match multer
      formData.append('challengeId', challengeId);
      formData.append('assignmentId', assignmentId);

      const response = await axios.post(
        'http://localhost:5000/api/submissions',
        formData,
        {
          headers: { 
            'x-auth-token': token,
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
          },
          timeout: 300000, // 5 minutes
          validateStatus: (status) => status < 500, // Prevent axios from rejecting 500s
        }
      );

      if (response.status === 201) {
        toast({
          title: 'Success',
          description: 'Video submitted successfully! Transcription in progress...',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        navigate(`/assignments/${assignmentId}`);
      } else {
        throw new Error(response.data.message || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        serverError: err.response?.data?.error
      });

      toast({
        title: 'Upload Failed',
        description: err.response?.data?.message || err.message || 'Failed to submit video',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Box as="form" onSubmit={onSubmit} p={4} borderWidth={1} borderRadius="lg">
      <Heading as="h2" size="lg" mb={4}>
        Submit Your Pitch
      </Heading>
      
      <FormControl mb={4}>
        <FormLabel>Upload Video:</FormLabel>
        <Input
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          onChange={(e) => setFile(e.target.files[0])}
          required
          isDisabled={uploading}
        />
        <Text fontSize="sm" color="gray.500" mt={1}>
          Supported formats: MP4, WebM, MOV (Max size: 50MB)
        </Text>
      </FormControl>

      {uploading && (
        <Box mb={4}>
          <Text mb={2}>Uploading: {uploadProgress}%</Text>
          <Progress 
            value={uploadProgress} 
            size="xs" 
            colorScheme="brand"
            isAnimated
          />
        </Box>
      )}

      <Alert status="info" mb={4}>
        <AlertIcon />
        Your video will be automatically transcribed after upload
      </Alert>

      <Button 
        type="submit" 
        colorScheme="brand" 
        isLoading={uploading}
        loadingText={`Uploading ${uploadProgress}%`}
        width="full"
      >
        Submit
      </Button>
    </Box>
  );
};

export default SubmissionForm;
