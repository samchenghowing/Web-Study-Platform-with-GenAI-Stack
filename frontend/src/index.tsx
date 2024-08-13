import * as React from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider, } from "react-router-dom";
import ErrorPage from "./pages/ErrorPage";
import HomePage from "./pages/LandingPage";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import EditorPage from "./pages/EditorPage";
import QuizPage from "./pages/QuizPage";

const router = createBrowserRouter([
    {
        path: "/",
        element: <HomePage />,
        errorElement: <ErrorPage />,
    },
    {
        path: "/editor",
        element: <EditorPage />,
        errorElement: <ErrorPage />,
    },
    {
        path: "/signin",
        element: <SignInPage />,
        errorElement: <ErrorPage />,
    },
    {
        path: "/signup",
        element: <SignUpPage />,
        errorElement: <ErrorPage />,
    },
    {
        path: "/quiz",
        element: <QuizPage />,
        errorElement: <ErrorPage />,
    },
]);

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);
root.render(
    <React.StrictMode>
        <RouterProvider router={router} />
    </React.StrictMode>
);
