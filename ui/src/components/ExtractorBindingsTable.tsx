import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { IExtractorBinding } from "../lib/Indexify/types";
import { Alert, Typography } from "@mui/material";
import { Box, Stack } from "@mui/system";
import React from "react";
import CompressIcon from "@mui/icons-material/Compress";
import Repository from "../lib/Indexify/repository";
import { Link } from "react-router-dom";
import { useTheme } from "@emotion/react";

const getRowId = (row: IExtractorBinding) => {
  return row.name;
};

const ExtractorBindingsTable = ({ repository }: { repository: Repository }) => {
  const columns: GridColDef[] = [
    {
      field: "name",
      headerName: "Name",
      width: 300,
      renderCell: (params) => {
        return (
          <Link
            color="inherit"
            to={`/${repository.name}/bindings/${params.value}`}
          >
            {params.value}
          </Link>
        );
      },
    },
    {
      field: "extractor",
      headerName: "Extractor",
      width: 200,
    },
    {
      field: "content_source",
      headerName: "Content Source",
      width: 150,
    },
    {
      field: "filters_eq",
      headerName: "Filters",
      width: 100,
      valueGetter: (params) => {
        return JSON.stringify(params.value);
      },
    },
    {
      field: "input_params",
      headerName: "Input Params",
      width: 200,
      valueGetter: (params) => {
        return JSON.stringify(params.value);
      },
    },
  ];

  const renderContent = () => {
    if (repository.extractorBindings.length === 0) {
      return (
        <Box mt={1} mb={2}>
          <Alert variant="outlined" severity="info">
            No Bindings Found
          </Alert>
        </Box>
      );
    }
    return (
      <Box
        sx={{
          width: "100%",
        }}
      >
        <DataGrid
          sx={{ backgroundColor: "white" }}
          autoHeight
          getRowId={getRowId}
          rows={repository.extractorBindings}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 5 },
            },
          }}
          pageSizeOptions={[5, 10]}
        />
      </Box>
    );
  };

  return (
    <>
      <Stack
        display={"flex"}
        direction={"row"}
        alignItems={"center"}
        spacing={2}
      >
        <CompressIcon />
        <Typography variant="h3">Extractor Bindings</Typography>
      </Stack>
      {renderContent()}
    </>
  );
};

export default ExtractorBindingsTable;
