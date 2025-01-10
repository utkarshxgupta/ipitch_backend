import React, { useEffect, useState } from 'react';
import { getExamples } from '../services/apiService';

const ExampleList = () => {
  const [examples, setExamples] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const result = await getExamples();
      setExamples(result);
    }
    fetchData();
  }, []);

  return (
    <div>
      <h1>Examples</h1>
      <ul>
        {examples.map(example => (
          <li key={example._id}>{example.name}: {example.description}</li>
        ))}
      </ul>
    </div>
  );
};

export default ExampleList;
