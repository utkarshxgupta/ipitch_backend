const axios = require('axios');
const logger = require('../utils/logger');

// Configuration
const API_URL = 'http://localhost:5000/api';
const USERS_TO_CREATE = 5;

// Generic names and common password
const genericNames = [
  'John Doe',
  'Jane Smith',
  'Alex Johnson',
  'Sam Wilson',
  'Taylor Brown',
  'Jordan Miller',
  'Casey Thompson',
  'Morgan Davis',
  'Riley Wilson',
  'Quinn Garcia'
];

// Function to create a single user
async function createUser(name, index) {
  const email = `trainee${index}@example.com`;
  const password = '123456';
  
  try {
    logger.info(`Creating user: ${name} (${email})`);
    
    const response = await axios.post(`${API_URL}/auth/register`, {
      name,
      email,
      password,
      role: 'trainee'
    });
    
    logger.info(`Successfully created user: ${name}`);
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      logger.error(`Failed to create user ${name}: ${JSON.stringify(error.response.data)}`);
    } else {
      logger.error(`Failed to create user ${name}: ${error.message}`);
    }
    return null;
  }
}

// Main function to create multiple users
async function createUsers() {
  logger.info(`Starting creation of ${USERS_TO_CREATE} users`);
  
  const createdUsers = [];
  
  for (let i = 0; i < USERS_TO_CREATE; i++) {
    const name = genericNames[i % genericNames.length];
    const user = await createUser(name, i + 1);
    
    if (user) {
      createdUsers.push(user);
    }
  }
  
  logger.info(`Created ${createdUsers.length} out of ${USERS_TO_CREATE} users`);
  return createdUsers;
}

// Execute the script if run directly
if (require.main === module) {
  createUsers()
    .then(() => {
      logger.info('User creation completed');
      process.exit(0);
    })
    .catch(error => {
      logger.error(`Script failed: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { createUsers };