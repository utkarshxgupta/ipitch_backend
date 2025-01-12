import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/authContext';
import SubmissionForm from './SubmissionForm';
import { toast } from 'react-toastify';

const ChallengeDetail = () => {
  const { id } = useParams();
  const { token } = useContext(AuthContext);
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChallenge = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/challenges/${id}`, {
          headers: { 'x-auth-token': token }
        });
        setChallenge(res.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        toast.error('Failed to fetch challenge');
        setLoading(false);
      }
    };

    fetchChallenge();
  }, [id, token]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!challenge) {
    return <div>Challenge not found</div>;
  }

  return (
    <div>
      <h2>{challenge.name}</h2>
      <p><strong>Description:</strong> {challenge.description}</p>
      <p><strong>Prompts:</strong> {challenge.prompts.join(', ')}</p>
      <p><strong>Ideal Pitch:</strong> {challenge.idealPitch}</p>
      <p><strong>Evaluation Criteria:</strong> {challenge.evaluationCriteria.join(', ')}</p>
      <p><strong>Created By:</strong> {challenge.createdBy.name}</p>
      <p><strong>Created Date:</strong> {new Date(challenge.createdDate).toLocaleDateString()}</p>
      <SubmissionForm challengeId={challenge._id} />
    </div>
  );
};

export default ChallengeDetail;
