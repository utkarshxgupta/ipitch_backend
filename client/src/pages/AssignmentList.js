import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Heading,
  List,
} from "@chakra-ui/react";
import CustomListItem from "../components/ListItem";

const AssignmentList = () => {
  const [assignments, setAssignments] = useState([]);
  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/assignments`,
          { headers: { "x-auth-token": localStorage.getItem("token") } }
        );
        const sortedAssignments = response.data.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setAssignments(sortedAssignments);
      } catch (err) {
        console.error("Error fetching assignments:", err);
      }
    };

    fetchAssignments();
  }, []);

  const isActive = (startDate, endDate) => {
    const now = new Date();
    return new Date(startDate) <= now && now <= new Date(endDate);
  };

  return (
    <Box p={5}>
      <List spacing={3}>
        {assignments.map((assignment) => (
          <CustomListItem
            key={assignment._id}
            id={assignment._id}
            heading={assignment.name}
            subheading={
              "Created on " +
              new Date(assignment.createdAt).toLocaleDateString()
            }
            badgeText={
              isActive(assignment.startDate, assignment.endDate)
                ? "Active"
                : "Inactive"
            }
            badgeColor={
              isActive(assignment.startDate, assignment.endDate)
                ? "green"
                : "red"
            }
            link={`/assignments/${assignment._id}`}
          />
        ))}
      </List>
    </Box>
  );
};

export default AssignmentList;
