import React from 'react';
import { ListItem, HStack, VStack, Text, Badge, useColorModeValue } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

const CustomListItem = ({ id, heading, subheading, badgeText, badgeColor, link }) => {
  const navigate = useNavigate();
  const hoverColor = useColorModeValue("brand.200", "brand.500");

  return (
    <ListItem 
      key={id} 
      p={5} 
      shadow="md" 
      borderWidth={1} 
      borderRadius="lg" 
      _hover={{ bg: hoverColor }} 
      onClick={() => navigate(link)}
    >
      <HStack justify="space-between">
        <VStack align="start">
          <Text fontSize="xl" fontWeight="bold">{heading}</Text>
          <Text>{subheading}</Text>
        </VStack>
        {badgeText && <Badge colorScheme={badgeColor}>{badgeText}</Badge>}
      </HStack>
    </ListItem>
  );
};

export default CustomListItem;