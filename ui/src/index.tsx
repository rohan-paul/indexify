import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

import { createBrowserRouter, RouterProvider } from "react-router-dom";

import Root, { loader as RootLoader } from "./routes/Root";
import { ErrorPage } from "./error-page";
import Extractors, { loader as ExtractorsLoader } from "./routes/Extractors";
import Repository, { loader as RepositoryLoader } from "./routes/Namespace";
import ExtractorBinding, {
  loader as ExtractorBindingLoader,
} from "./routes/Namespace/ExtractorBinding";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    errorElement: <ErrorPage />,
    loader: RootLoader,
    children: [
      {
        path: "/:namespace",
        element: <Repository />,
        loader: RepositoryLoader,
        errorElement: <ErrorPage />,
      },
      {
        path: "/:namespace/extractors",
        element: <Extractors />,
        loader: ExtractorsLoader,
        errorElement: <ErrorPage />,
      },
      {
        path: "/:namespace/bindings/:bindingname",
        element: <ExtractorBinding />,
        loader: ExtractorBindingLoader,
        errorElement: <ExtractorBinding />,
      },
    ],
  },
]);

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
