import React, { useState, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/authContext';
import { toast } from 'react-toastify';

const SubmissionForm = ({ challengeId }) => {
  const { token } = useContext(AuthContext);
  const [pitch, setPitch] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        'http://localhost:5000/api/submissions',
        { challengeId, pitch },
        { headers: { 'x-auth-token': token } }
      );
      toast.success('Pitch submitted successfully!');
      setPitch('');
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit pitch');
    }
  };

  return (
    <div>
      <h2>Submit Your Pitch</h2>
      <form onSubmit={onSubmit}>
        <div>
          <label>Pitch (Video URL/ID):</label>
          <input type="text" value={pitch} onChange={(e) => setPitch(e.target.value)} required />
        </div>
        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default SubmissionForm;
