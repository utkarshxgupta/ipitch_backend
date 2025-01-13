import React, { useState } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Button, Input, CheckboxGroup, Checkbox, VStack
} from "@chakra-ui/react";

const SelectModal = ({ title, items, selectedItems, setSelectedItems, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleChange = (values) => {
    setSelectedItems(values);
  };

  return (
    <Modal isOpen onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{title}</ModalHeader>
        <ModalBody>
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            mb={4}
          />
          <CheckboxGroup value={selectedItems} onChange={handleChange}>
            <VStack align="start" maxH="300px" overflowY="auto">
              {filteredItems.map((item) => (
                <Checkbox key={item._id} value={item._id}>
                  {item.name}
                </Checkbox>
              ))}
            </VStack>
          </CheckboxGroup>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose} colorScheme="brand">
            Done
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default SelectModal;