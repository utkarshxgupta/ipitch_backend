import React, { useContext } from 'react';
import AuthContext from '../context/authContext';

const Home = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <div>
      <h1>Home Page</h1>
      {user && (
        <div>
          <p>Welcome, {user.name}</p>
          <button onClick={logout}>Logout</button>
        </div>
      )}
    </div>
  );
};

export default Home;
