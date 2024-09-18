import * as React from "react";
import { Suspense, lazy } from "react";
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import ErrorPage from './pages/ErrorPage';
import LoadingPage from './pages/LoadingPage';
import PrivateRoute from './authentication/PrivateRoute';
import { AuthProvider } from './authentication/AuthContext';

const HomePage = lazy(() => import('./pages/LandingPage'));
const SignInPage = lazy(() => import('./pages/SignInPage'));
const SignUpPage = lazy(() => import('./pages/SignUpPage'));
const MainPage = lazy(() => import('./pages/MainPage'));
const EditorPage = lazy(() => import('./pages/EditorPage'));
const QuizPage = lazy(() => import('./pages/QuizPage'));
const UploadPage = lazy(() => import('./pages/UploadPage'));

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
        path: '/main',
        element: (
            // <PrivateRoute>
                <Suspense fallback={<LoadingPage />}>
                    <MainPage />
                </Suspense>
            // </PrivateRoute>
        ),
        errorElement: <ErrorPage />,
        children: [
            {
                index: true,
                element: <Navigate to="/main/editor" replace />,
            },
            {
                path: 'editor',
                element: (
                    <Suspense fallback={<LoadingPage />}>
                        <EditorPage />
                    </Suspense>
                ),
                errorElement: <ErrorPage />,
            },
            {
                path: 'quiz',
                element: (
                    <Suspense fallback={<LoadingPage />}>
                        <QuizPage />
                    </Suspense>
                ),
                errorElement: <ErrorPage />,
            },
            {
                path: 'upload',
                element: (
                    <Suspense fallback={<LoadingPage />}>
                        <UploadPage />
                    </Suspense>
                ),
                errorElement: <ErrorPage />,
            },
        ],
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
