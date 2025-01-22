import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Heading,
  Text,
  Spinner,
  Alert,
  AlertIcon,
  List,
} from "@chakra-ui/react";
import CustomListItem from "../components/ListItem";

const MySubmissions = ({ assignmentId }) => {
  console.log(assignmentId);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/submissions/user/assignment/${assignmentId}`,
          {
            headers: { "x-auth-token": localStorage.getItem("token") },
          }
        );
        setSubmissions(res.data);
      } catch (err) {
        setError(err.response ? err.response.data.msg : "Server error");
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, [assignmentId]);

  if (loading) return <Spinner size="xl" />;
  if (error)
    return (
      <Alert status="error">
        <AlertIcon />
        {error}
      </Alert>
    );

  return (
    <Box mt={8}>
      <Heading size="md" mb={4}>
        My Submissions
      </Heading>
      {submissions.length === 0 ? (
        <Text>No submissions yet.</Text>
      ) : (
        <List spacing={3}>
          {submissions.map((submission) => (
            <CustomListItem
              key={submission._id}
              id={submission._id}
              heading={submission.videoFileName}
              subheading={new Date(submission.submittedDate).toLocaleString()}
              badgeText={submission.transcriptionStatus}
              badgeColor={submission.transcriptionStatus === "completed" ? "green" : "red"}
              link={`/submissions/${submission._id}`}
              />
          ))}
        </List>
      )}
    </Box>
  );
};

export default MySubmissions;
