import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/authContext';
import { toast } from 'react-toastify';

const Assignments = () => {
  const { token } = useContext(AuthContext);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/assignments/user', {
          headers: { 'x-auth-token': token }
        });
        setAssignments(res.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        toast.error('Failed to fetch assignments');
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [token]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!assignments.length) {
    return <div>No assignments found</div>;
  }

  return (
    <div>
      <h2>Your Assignments</h2>
      <ul>
        {assignments.map(assignment => (
          <li key={assignment._id}>
            <h3>{assignment.name}</h3>
            <p><strong>Start Date:</strong> {new Date(assignment.startDate).toLocaleDateString()}</p>
            <p><strong>End Date:</strong> {new Date(assignment.endDate).toLocaleDateString()}</p>
            <ul>
              {assignment.challenges.map(challenge => (
                <li key={challenge._id}>
                  <Link to={`/challenges/${challenge._id}`}>{challenge.name}</Link>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Assignments;
