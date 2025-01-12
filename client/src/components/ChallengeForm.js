import React, { useState, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/authContext';
import { toast } from 'react-toastify';

const ChallengeForm = () => {
  const { token } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    prompts: '',
    idealPitch: '',
    evaluationCriteria: ''
  });

  const { name, description, prompts, idealPitch, evaluationCriteria } = formData;

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        'http://localhost:5000/api/challenges',
        {
          name,
          description,
          prompts: prompts.split(',').map(prompt => prompt.trim()),
          idealPitch,
          evaluationCriteria: evaluationCriteria.split(',').map(criteria => criteria.trim())
        },
        { headers: { 'x-auth-token': token } }
      );
      toast.success('Challenge created successfully!');
      setFormData({
        name: '',
        description: '',
        prompts: '',
        idealPitch: '',
        evaluationCriteria: ''
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to create challenge');
    }
  };

  return (
    <div>
      <h2>Create Challenge</h2>
      <form onSubmit={onSubmit}>
        <div>
          <label>Name:</label>
          <input type="text" name="name" value={name} onChange={onChange} required />
        </div>
        <div>
          <label>Description:</label>
          <textarea name="description" value={description} onChange={onChange} required />
        </div>
        <div>
          <label>Prompts (comma separated):</label>
          <textarea name="prompts" value={prompts} onChange={onChange} />
        </div>
        <div>
          <label>Ideal Pitch (Video URL/ID):</label>
          <input type="text" name="idealPitch" value={idealPitch} onChange={onChange} />
        </div>
        <div>
          <label>Evaluation Criteria (comma separated):</label>
          <textarea name="evaluationCriteria" value={evaluationCriteria} onChange={onChange} required />
        </div>
        <button type="submit">Create Challenge</button>
      </form>
    </div>
  );
};

export default ChallengeForm;
