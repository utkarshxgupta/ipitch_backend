import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/authContext';
import { toast } from 'react-toastify';

const ChallengeList = () => {
  const { token } = useContext(AuthContext);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/challenges', {
          headers: { 'x-auth-token': token }
        });
        setChallenges(res.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        toast.error('Failed to fetch challenges');
        setLoading(false);
      }
    };

    fetchChallenges();
  }, [token]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2>Challenge List</h2>
      <ul>
        {challenges.map(challenge => (
          <li key={challenge._id}>
            <Link to={`/challenges/${challenge._id}`}>
              {challenge.name} - {challenge.createdBy.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ChallengeList;
