import React, { useState, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/authContext';
import { toast } from 'react-toastify';

const EvaluationForm = ({ submissionId, onEvaluation }) => {
  const { token } = useContext(AuthContext);
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `http://localhost:5000/api/submissions/${submissionId}/evaluate`,
        { score, feedback },
        { headers: { 'x-auth-token': token } }
      );
      toast.success('Evaluation submitted successfully!');
      onEvaluation(res.data); // Pass updated data back to parent
      setScore('');
      setFeedback('');
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit evaluation');
    }
  };

  return (
    <div>
      <h2>Submit Evaluation</h2>
      <form onSubmit={onSubmit}>
        <div>
          <label>Score:</label>
          <input type="number" value={score} onChange={(e) => setScore(e.target.value)} required />
        </div>
        <div>
          <label>Feedback:</label>
          <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} required />
        </div>
        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default EvaluationForm;
