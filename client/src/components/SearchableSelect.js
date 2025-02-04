import React from 'react';
import {
  Box,
  Input,
  Checkbox,
  VStack,
  HStack,
  Text,
  Button,
  InputGroup,
  InputLeftElement,
  Badge,
} from "@chakra-ui/react";
import { SearchIcon } from '@chakra-ui/icons';

const SearchableSelect = ({
  items,
  selectedItems,
  onSelect,
  searchPlaceholder,
  displayKey,
  secondaryKey,
  isLoading
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  
  const filteredItems = items.filter(item =>
    item[displayKey].toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box>
      <InputGroup mb={3}>
        <InputLeftElement pointerEvents='none'>
          <SearchIcon color='gray.300' />
        </InputLeftElement>
        <Input
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </InputGroup>

      {selectedItems.length > 0 && (
        <HStack mb={3} wrap="wrap">
          <Badge colorScheme="brand">
            {selectedItems.length} selected
          </Badge>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onSelect([])}
          >
            Clear all
          </Button>
        </HStack>
      )}

      <VStack
        align="stretch"
        maxH="300px"
        overflowY="auto"
        borderWidth={1}
        borderRadius="md"
        p={2}
      >
        {filteredItems.map((item) => (
          <Checkbox
            key={item._id}
            isChecked={selectedItems.includes(item._id)}
            onChange={(e) => {
              const newSelected = e.target.checked
                ? [...selectedItems, item._id]
                : selectedItems.filter(id => id !== item._id);
              onSelect(newSelected);
            }}
          >
            <Text>
              {item[displayKey]}
              {secondaryKey && (
                <Text as="span" color="gray.500" ml={2}>
                  ({item[secondaryKey]})
                </Text>
              )}
            </Text>
          </Checkbox>
        ))}
        {filteredItems.length === 0 && (
          <Text color="gray.500" p={2}>No items found</Text>
        )}
      </VStack>
    </Box>
  );
};

export default SearchableSelect;