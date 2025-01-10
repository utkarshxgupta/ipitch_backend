import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const getExamples = async () => {
  try {
    const response = await axios.get(`${API_URL}/examples`);
    return response.data;
  } catch (error) {
    console.error('Error fetching data from API', error);
  }
};

export const createExample = async (example) => {
  try {
    const response = await axios.post(`${API_URL}/examples`, example);
    return response.data;
  } catch (error) {
    console.error('Error posting data to API', error);
  }
};
