// src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import {
  createBrowserRouter,
  Outlet,
  RouterProvider,
} from "react-router-dom";
import HostingPage from './HostingPage';
import Header from './Header';
import { FileProvider } from './test';
import { basename } from 'path';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

function Layout() {
  return (
    <>
      <Header />
      <Outlet />
    </>
  );
}

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      {
        path: '/',
        element: <App />
      },
      {
        path: '/hosting',
        element: <HostingPage />
      },
      {
        path: '/cycling',
        element: <App />
      },
    ]
  }
], { basename: "route_mapping" });

root.render(
  <React.StrictMode>
    <FileProvider>
      <RouterProvider router={router} />
    </FileProvider>
  </React.StrictMode>
);

reportWebVitals();
