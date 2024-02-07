import IndexifyClient from "../../lib/Indexify/client";
import { useLoaderData, LoaderFunctionArgs, redirect } from "react-router-dom";
import { Box, Typography, Stack, Breadcrumbs } from "@mui/material";
import { ITask } from "../../lib/Indexify/types";
import React from "react";
import TasksTable from "../../components/TasksTable";
import Repository from "../../lib/Indexify/repository";
import { Link } from "react-router-dom";

export async function loader({ params }: LoaderFunctionArgs) {
  const namespace = params.namespace;
  const bindingname = params.bindingname;
  if (!namespace || !bindingname) return redirect("/");

  const client = new IndexifyClient();
  const repository = await client.getRepository(namespace);
  const tasks = await repository.getTasks(bindingname);

  return { tasks, bindingname, repository };
}

const ExtractorBindingPage = () => {
  const { tasks, bindingname, repository } = useLoaderData() as {
    tasks: ITask[];
    bindingname: string;
    repository: Repository;
  };

  return (
    <Stack direction="column" spacing={3}>
      <Breadcrumbs aria-label="breadcrumb">
        <Link color="inherit" to={`/${repository.name}`}>
          {repository.name}
        </Link>
        <Typography color="text.primary">Extractor Bindings</Typography>
        <Typography color="text.primary">{bindingname}</Typography>
      </Breadcrumbs>
      <Box display={"flex"} alignItems={"center"}>
        <Typography variant="h2" component="h1">
          {bindingname}
        </Typography>
      </Box>
      <TasksTable tasks={tasks} />
    </Stack>
  );
};

export default ExtractorBindingPage;
