import * as React from "react";
import { Suspense, lazy } from "react";
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import ErrorPage from './pages/ErrorPage';
import LoadingPage from './pages/LoadingPage';
import PrivateRoute from './authentication/PrivateRoute';
import { AuthProvider } from './authentication/AuthContext';

const HomePage = lazy(() => import('./pages/LandingPage'));
const SignInPage = lazy(() => import('./pages/SignInPage'));
const SignUpPage = lazy(() => import('./pages/SignUpPage'));
const EditorPage = lazy(() => import('./pages/EditorPage'));
const QuizPage = lazy(() => import('./pages/QuizPage'));

const router = createBrowserRouter([
    {
        path: '/',
        element: (
            <Suspense fallback={<LoadingPage />}>
                <HomePage />
            </Suspense>
        ),
        errorElement: <ErrorPage />,
    },
    {
        path: '/signin',
        element: (
            <Suspense fallback={<LoadingPage />}>
                <SignInPage />
            </Suspense>
        ),
        errorElement: <ErrorPage />,
    },
    {
        path: '/signup',
        element: (
            <Suspense fallback={<LoadingPage />}>
                <SignUpPage />
            </Suspense>
        ),
        errorElement: <ErrorPage />,
    },
    {
        path: '/editor',
        element: (
            // <PrivateRoute>
                <Suspense fallback={<LoadingPage />}>
                    <EditorPage />
                </Suspense>
            // </PrivateRoute>
        ),
        errorElement: <ErrorPage />,
    },
    {
        path: '/quiz',
        element: (
            // <PrivateRoute>
                <Suspense fallback={<LoadingPage />}>
                    <QuizPage />
                </Suspense>
            // </PrivateRoute>
        ),
        errorElement: <ErrorPage />,
    },
]);

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);
root.render(
    <React.StrictMode>
        <AuthProvider>
            <RouterProvider router={router} />
        </AuthProvider>
    </React.StrictMode>
);
