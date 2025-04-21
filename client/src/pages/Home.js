import React, { useContext } from 'react';
import AuthContext from '../context/authContext';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  VStack,
  SimpleGrid,
  Icon,
  Flex,
  Stack,
  useColorModeValue,
  Stat,
  StatLabel,
  StatNumber,
  Link,
  Image,
} from "@chakra-ui/react";
import { FaMicrophone, FaChartLine, FaUsers, FaTrophy } from 'react-icons/fa';
import LandingPageBanner from '../assets/images/undraw_shared-goals_jn0a.svg';

const Feature = ({ title, text, icon }) => {
  return (
    <VStack
      align={'center'}
      p={6}
      bg={useColorModeValue('white', 'gray.700')}
      rounded={'xl'}
      shadow={'md'}
      transition="all 0.3s"
      _hover={{ transform: 'translateY(-5px)', shadow: 'lg' }}
    >
      <Flex
        w={16}
        h={16}
        align={'center'}
        justify={'center'}
        color={'white'}
        rounded={'full'}
        bg={'brand.500'}
        mb={4}
      >
        <Icon as={icon} w={8} h={8} />
      </Flex>
      <Heading size="md" mb={2}>{title}</Heading>
      <Text textAlign="center" color={useColorModeValue('gray.600', 'gray.300')}>
        {text}
      </Text>
    </VStack>
  );
};

const Home = () => {
  const { user } = useContext(AuthContext);
  const bgGradient = useColorModeValue(
    'linear(to-r, brand.100, brand.300)',
    'linear(to-r, gray.700, gray.900)'
  );

  return (
    <Box>
      {/* Hero Section */}
      <Box 
        bgGradient={bgGradient}
        py={20}
        px={4}
      >
        <Container maxW="container.xl">
          <Stack 
            direction={{ base: 'column', md: 'row' }}
            spacing={8}
            align="center"
            justify="space-between"
          >
            <VStack align="flex-start" spacing={6} maxW="600px">
              <Heading 
                as="h1" 
                size="2xl"
                bgGradient="linear(to-r, brand.400, brand.600)"
                bgClip="text"
              >
                Master Your Pitch
              </Heading>
              <Text fontSize="xl" color={useColorModeValue('gray.600', 'gray.300')}>
                Enhance your presentation skills with AI-powered feedback and expert evaluation.
              </Text>
              {!user ? (
                <Stack direction={{ base: 'column', sm: 'row' }} spacing={4}>
                  <Button 
                    as={RouterLink} 
                    to="/register" 
                    colorScheme="brand" 
                    size="lg"
                  >
                    Get Started
                  </Button>
                  <Button 
                    as={RouterLink} 
                    to="/login" 
                    variant="outline" 
                    size="lg"
                  >
                    Sign In
                  </Button>
                </Stack>
              ) : (
                <Button 
                  as={RouterLink} 
                  to={`/${user.role}`} 
                  colorScheme="brand" 
                  size="lg"
                >
                  Go to Dashboard
                </Button>
              )}
            </VStack>
            
            <Image 
              src={LandingPageBanner} 
              alt="Pitch presentation illustration" 
              maxW={{ base: "100%", md: "450px" }}
              display={{ base: 'none', md: 'block' }}
              mt={{ base: 8, md: 0 }}
            />
          </Stack>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxW="container.xl" py={20}>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={10}>
          <Feature
            icon={FaMicrophone}
            title="Practice Pitches"
            text="Record and review your pitches with our easy-to-use platform"
          />
          <Feature
            icon={FaChartLine}
            title="AI Analysis"
            text="Get instant feedback on your delivery and presentation style"
          />
          <Feature
            icon={FaUsers}
            title="Expert Feedback"
            text="Receive detailed evaluations from industry professionals"
          />
          <Feature
            icon={FaTrophy}
            title="Track Progress"
            text="Monitor your improvement over time with detailed analytics"
          />
        </SimpleGrid>
      </Container>

      {/* Stats Section */}
      <Box bg={useColorModeValue('gray.50', 'gray.800')} py={20}>
        <Container maxW="container.xl">
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10}>
            <Stat
              px={4}
              py={6}
              bg={useColorModeValue('white', 'gray.700')}
              shadow="md"
              rounded="lg"
              textAlign="center"
            >
              <StatLabel fontSize="lg">Active Users</StatLabel>
              <StatNumber fontSize="4xl" fontWeight="bold" color="brand.500">
                1,000+
              </StatNumber>
            </Stat>
            <Stat
              px={4}
              py={6}
              bg={useColorModeValue('white', 'gray.700')}
              shadow="md"
              rounded="lg"
              textAlign="center"
            >
              <StatLabel fontSize="lg">Pitches Evaluated</StatLabel>
              <StatNumber fontSize="4xl" fontWeight="bold" color="brand.500">
                5,000+
              </StatNumber>
            </Stat>
            <Stat
              px={4}
              py={6}
              bg={useColorModeValue('white', 'gray.700')}
              shadow="md"
              rounded="lg"
              textAlign="center"
            >
              <StatLabel fontSize="lg">Success Rate</StatLabel>
              <StatNumber fontSize="4xl" fontWeight="bold" color="brand.500">
                85%
              </StatNumber>
            </Stat>
          </SimpleGrid>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;
