import IndexifyClient from "../../lib/Indexify/client";
import Repository from "../../lib/Indexify/repository";
import { useLoaderData, LoaderFunctionArgs } from "react-router-dom";
import { Stack } from "@mui/material";
import { IContent, IIndex } from "../../lib/Indexify/types";
import IndexTable from "../../components/IndexTable";
import ContentTable from "../../components/ContentTable";
import React from "react";
import ExtractorBindingsTable from "../../components/ExtractorBindingsTable";

export async function loader({ params }: LoaderFunctionArgs) {
  const name = params.namespace;
  const client = new IndexifyClient();
  if (name === undefined) return null;

  const repository = await client.getRepository(name);
  const [indexes, contentList] = await Promise.all([
    repository.indexes(),
    repository.getContent(),
  ]);
  return { repository, indexes, contentList };
}

const NamespacePage = () => {
  const { repository, indexes, contentList } = useLoaderData() as {
    repository: Repository;
    indexes: IIndex[];
    contentList: IContent[];
  };

  return (
    <Stack direction="column" spacing={3}>
      <ExtractorBindingsTable repository={repository} />
      <IndexTable indexes={indexes} />
      <ContentTable repository={repository} content={contentList} />
    </Stack>
  );
};

export default NamespacePage;
