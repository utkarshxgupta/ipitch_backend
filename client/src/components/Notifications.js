import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/authContext';
import { toast } from 'react-toastify';

const Notifications = () => {
  const { token } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/notifications', {
          headers: { 'x-auth-token': token }
        });
        setNotifications(res.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        toast.error('Failed to fetch notifications');
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [token]);

  const markAsRead = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/notifications/${id}/read`, {}, {
        headers: { 'x-auth-token': token }
      });
      setNotifications(
        notifications.map(notif =>
          notif._id === id ? { ...notif, read: true } : notif
        )
      );
      toast.success('Notification marked as read');
    } catch (err) {
      console.error(err);
      toast.error('Failed to mark notification as read');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!notifications.length) {
    return <div>No notifications found</div>;
  }

  return (
    <div>
      <h2>Notifications</h2>
      <ul>
        {notifications.map(notif => (
          <li key={notif._id} style={{ textDecoration: notif.read ? 'line-through' : 'none' }}>
            <p>{notif.message}</p>
            {!notif.read && <button onClick={() => markAsRead(notif._id)}>Mark as Read</button>}
            <p><small>{new Date(notif.date).toLocaleString()}</small></p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Notifications;
