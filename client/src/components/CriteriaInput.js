import React from 'react';
import {
  VStack,
  HStack,
  Input,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Text,
  Button,
  Box
} from '@chakra-ui/react';

const CriteriaInput = ({ criteria, onAdd, onUpdate, onRemove }) => {
  const [keyword, setKeyword] = React.useState('');
  const [weight, setWeight] = React.useState(0);

  const handleSubmit = () => {
    if (keyword.trim()) {
      onAdd({ keyword: keyword.trim(), weight });
      setKeyword('');
      setWeight(0);
    }
  };

  return (
    <VStack spacing={4} width="100%" align="stretch">
      <HStack spacing={4}>
        <Input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Enter keyword"
          flex={1}
        />
        <Box width="200px">
          <Slider
            min={-5}
            max={5}
            step={1}
            value={weight}
            onChange={setWeight}
            colorScheme={weight >= 0 ? 'green' : 'red'}
          >
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb boxSize={6}>
              <Text fontSize="xs">{weight}</Text>
            </SliderThumb>
          </Slider>
        </Box>
        <Button onClick={handleSubmit} colorScheme="brand">
          Add
        </Button>
      </HStack>

      {criteria.map((item, index) => (
        <HStack key={index} spacing={4} p={2} bg="gray.50" borderRadius="md">
          <Text flex={1}>{item.keyword}</Text>
          <Text width="50px" textAlign="center">
            Weight: {item.weight}
          </Text>
          <Button size="sm" onClick={() => onRemove(index)} colorScheme="red">
            Remove
          </Button>
        </HStack>
      ))}
    </VStack>
  );
};

export default CriteriaInput;