import { Typography } from "@mui/material";
import { Box } from "@mui/system";
import React from "react";
import { Link } from "react-router-dom";

const HomePage = () => {
  return (
    <Box sx={{ height: "100%" }}>
      <Typography variant="h2" component="h1">
        Welcome to Indexify
      </Typography>

      <Typography variant="body1">
        <Link to="https://getindexify.ai" target="_blank" rel="noreferrer">
          Read documentation
        </Link>
      </Typography>
    </Box>
  );
};

export default HomePage;
