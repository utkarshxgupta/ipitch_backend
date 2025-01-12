import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/authContext';
import EvaluationForm from './EvaluationForm';
import { toast } from 'react-toastify';

const SubmissionList = () => {
  const { id } = useParams(); // Challenge ID
  const { token } = useContext(AuthContext);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/submissions/${id}`, {
          headers: { 'x-auth-token': token }
        });
        setSubmissions(res.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        toast.error('Failed to fetch submissions');
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [id, token]);

  const handleEvaluation = (updatedSubmission) => {
    setSubmissions(
      submissions.map(sub =>
        sub._id === updatedSubmission._id ? updatedSubmission : sub
      )
    );
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!submissions.length) {
    return <div>No submissions found</div>;
  }

  return (
    <div>
      <h2>Submissions</h2>
      <ul>
        {submissions.map(submission => (
          <li key={submission._id}>
            <p><strong>Trainee:</strong> {submission.trainee.name}</p>
            <p><strong>Pitch:</strong> {submission.pitch}</p>
            <p><strong>Submitted Date:</strong> {new Date(submission.submittedDate).toLocaleDateString()}</p>
            <EvaluationForm submissionId={submission._id} onEvaluation={handleEvaluation} />
            <h3>Evaluations</h3>
            <ul>
              {submission.evaluations.map(evaluation => (
                <li key={evaluation._id}>
                  <p><strong>Evaluator:</strong> {evaluation.evaluator.name}</p>
                  <p><strong>Score:</strong> {evaluation.score}</p>
                  <p><strong>Feedback:</strong> {evaluation.feedback}</p>
                  <p><strong>Date:</strong> {new Date(evaluation.evaluatedDate).toLocaleDateString()}</p>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SubmissionList;
