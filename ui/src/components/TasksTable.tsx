import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { ITask } from "../lib/Indexify/types";
import { Alert, Typography } from "@mui/material";
import { Box, Stack } from "@mui/system";
import React from "react";
import AssignmentIcon from "@mui/icons-material/Assignment";
import moment from "moment";

const TasksTable = ({ tasks }: { tasks: ITask[] }) => {
  const columns: GridColDef[] = [
    {
      field: "id",
      headerName: "ID",
      width: 200,
    },
    {
      field: "outcome",
      headerName: "Outcome",
      width: 100,
    },
    {
      field: "content_metadata.source",
      headerName: "Source",
      renderCell: (params) => {
        return params.row.content_metadata.source;
      },
      width: 100,
    },
    {
      field: "content_metadata.storage_url",
      headerName: "Storage URL",
      renderCell: (params) => {
        return params.row.content_metadata.storage_url;
      },
      width: 500,
    },
    {
      field: "content_metadata",
      headerName: "Source",
      renderCell: (params) => {
        return params.value.source;
      },
      width: 100,
    },
    {
      field: "content_metadata.created_at",
      headerName: "Created At",
      renderCell: (params) => {
        return moment(params.row.content_metadata.created_at * 1000).format(
          "MM/DD/YYYY h:mm A"
        );
      },
      width: 200,
    },
  ];

  const renderContent = () => {
    if (tasks.length === 0) {
      return (
        <Box mt={1} mb={2}>
          <Alert variant="outlined" severity="info">
            No Tasks Found
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
          rows={tasks}
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
        <AssignmentIcon />
        <Typography variant="h3">Tasks</Typography>
      </Stack>
      {renderContent()}
    </>
  );
};

export default TasksTable;
