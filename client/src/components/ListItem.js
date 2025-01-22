import React from 'react';
import { ListItem, HStack, VStack, Text, Badge, useColorModeValue, Icon } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { FaChevronRight } from 'react-icons/fa';

const CustomListItem = ({ id, heading, subheading, badgeText, badgeColor, link }) => {
  const navigate = useNavigate();
  const bgColor = useColorModeValue("white", "gray.700");
  const hoverBg = useColorModeValue("gray.50", "gray.600");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  return (
    <ListItem 
      key={id} 
      p={6}
      bg={bgColor}
      shadow="sm"
      borderWidth={1}
      borderColor={borderColor}
      borderRadius="lg"
      cursor="pointer"
      transition="all 0.2s"
      role="group"
      onClick={() => navigate(link)}
      _hover={{ 
        transform: 'translateY(-2px)',
        shadow: 'md',
        bg: hoverBg,
        borderColor: 'brand.500'
      }}
      _focus={{
        outline: 'none',
        ring: 2,
        ringColor: 'brand.500'
      }}
      tabIndex={0}
      aria-label={`View details for ${heading}`}
    >
      <HStack justify="space-between" spacing={4}>
        <VStack align="start" spacing={2} flex={1}>
          <Text 
            fontSize="lg" 
            fontWeight="bold"
            color={useColorModeValue("gray.800", "white")}
            _groupHover={{ color: 'brand.500' }}
          >
            {heading}
          </Text>
          <Text 
            fontSize="sm" 
            color={useColorModeValue("gray.600", "gray.300")}
          >
            {subheading}
          </Text>
        </VStack>
        
        <HStack spacing={4} align="center">
          {badgeText && (
            <Badge
              colorScheme={badgeColor}
              px={3}
              py={1}
              borderRadius="full"
              textTransform="capitalize"
              fontSize="sm"
            >
              {badgeText}
            </Badge>
          )}
          <Icon 
            as={FaChevronRight} 
            color="gray.400"
            _groupHover={{ 
              color: 'brand.500',
              transform: 'translateX(2px)'
            }}
            transition="all 0.2s"
          />
        </HStack>
      </HStack>
    </ListItem>
  );
};

export default CustomListItem;