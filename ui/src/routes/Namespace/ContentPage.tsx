import IndexifyClient from "../../lib/Indexify/client";
import { useLoaderData, LoaderFunctionArgs, redirect } from "react-router-dom";
import { Box, Typography, Stack, Breadcrumbs } from "@mui/material";
import { IContent, ITask } from "../../lib/Indexify/types";
import React from "react";
import TasksTable from "../../components/TasksTable";
import Repository from "../../lib/Indexify/repository";
import { Link } from "react-router-dom";

export async function loader({ params }: LoaderFunctionArgs) {
  const namespace = params.namespace;
  const parentId = params.parentId;
  if (!namespace || !parentId) return redirect("/");

  const client = new IndexifyClient();
  const repository = await client.getRepository(namespace);

  const content = await repository.getContent(parentId).then((res) => res[0]);
  const tasks = await repository
    .getTasks(content.source)
    .then((tasks) =>
      tasks.filter((t) => t.content_metadata.id === content.parent_id)
    );

  return { repository, tasks, content };
}

const ContentPage = () => {
  const { tasks, repository, content } = useLoaderData() as {
    tasks: ITask[];
    repository: Repository;
    content: IContent;
  };

  const displayValues = [
    { title: "ID", value: content.id },
    {
      title: "Parent ID",
      value: content.parent_id,
    },
    {
      title: "Name",
      value: content.name,
    },
    {
      title: "Source",
      value: content.source,
    },
    {
      title: "Content Type",
      value: content.content_type,
    },
    {
      title: "Storage URL",
      value: content.storage_url,
    },
  ] as { title: string; value: string }[];

  return (
    <Stack direction="column" spacing={3}>
      <Breadcrumbs aria-label="breadcrumb">
        <Link color="inherit" to={`/${repository.name}`}>
          {repository.name}
        </Link>
        <Typography color="text.primary">Content</Typography>
        <Typography color="text.primary">{content.parent_id}</Typography>
      </Breadcrumbs>

      {displayValues.map(({ title, value }) => (
        <Box>
          <Typography variant="h3" gutterBottom>
            {title}
          </Typography>
          <Typography variant="body2">{value}</Typography>
        </Box>
      ))}

      <TasksTable repository={repository} tasks={tasks} />
    </Stack>
  );
};

export default ContentPage;
