/** index.tsx:  
 * 1. Root tsx
 * 2. Website Routining (URL Linkage)
 * */ 

import * as React from "react";
import { Suspense, lazy } from "react";
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';

import ErrorPage from './pages/ErrorPage';
import LoadingPage from './pages/LoadingPage';
import PrivateRoute from './authentication/PrivateRoute';
import { AuthProvider } from './authentication/AuthContext';
import StudyMainPage from "./pages/StudyPlan/StudyMainPage";
import StudyHtmlPage from "./pages/StudyPlan/StudyHtmlPage";
import StudyCssPage from "./pages/StudyPlan/StudyCssPage";
import StudyJavaScriptPage from "./pages/StudyPlan/StudyJavaScriptPage";


const HomePage = lazy(() => import('./pages/LandingPage'));
const MainPage = lazy(() => import('./pages/MainPage'));
const EditorPage = lazy(() => import('./pages/EditorPage'));
const QuizPage = lazy(() => import('./pages/QuizPage'));
const UploadPage = lazy(() => import('./pages/UploadPage'));
const ProgressPage = lazy(() => import('./pages/ProgressPage'));
const FriendsPage = lazy(() => import('./pages/FriendsPage'));
const InfoPage = lazy(() => import('./pages/InfoPage'));
const LibPage = lazy(() =>  import('./pages/LibPage'));

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
        path: '/info',
        element: (
            <Suspense fallback={<LoadingPage />}>
                <InfoPage />
            </Suspense>
        ),
        errorElement: <ErrorPage />,
    },
    {
        path: '/begin', // Landing Page
        element: (
            <Suspense fallback={<LoadingPage />}>
                <QuizPage />
            </Suspense>
        ),
        errorElement: <ErrorPage />,
    },
    {
        path: '/quiz', 
        element: (
            <Suspense fallback={<LoadingPage />}>
                <QuizPage />
            </Suspense>
        ),
        errorElement: <ErrorPage />,
    },
    {
        path: '/studyplan',
        element: (
            <PrivateRoute>
                <Suspense fallback={<LoadingPage />}>
                    
                </Suspense>
            </PrivateRoute>
        ),
        errorElement: <ErrorPage />,
        children: [
            {
                index: true,
                element: <Navigate to="/studyplan/html" replace />,
            },
            {
                path: 'main',
                element: (
                    <Suspense fallback={<LoadingPage />}>
                        <StudyMainPage />
                    </Suspense>
                ),
                errorElement: <ErrorPage />,
            },
            {  
                path: 'html',
                element: (
                    <Suspense fallback={<LoadingPage />}>
                        < StudyHtmlPage />
                    </Suspense>
                ),
                errorElement: <ErrorPage />,
            },
            {
                path: 'css',
                element: (
                    <Suspense fallback={<LoadingPage />}>
                        <StudyCssPage />
                    </Suspense>
                ),
                errorElement: <ErrorPage />,
            },
            {
                path: 'javascript',
                element: (
                    <Suspense fallback={<LoadingPage />}>
                        < StudyJavaScriptPage />
                    </Suspense>
                ),
                errorElement: <ErrorPage />,
            }
        ],
    },
    {
        path: '/main',
        element: (
            <PrivateRoute>
                <Suspense fallback={<LoadingPage />}>
                    <MainPage />
                </Suspense>
            </PrivateRoute>
        ),
        errorElement: <ErrorPage />,
        children: [
            {
                index: true,
                element: <Navigate to="/main/Lib" replace />,
            },
            {
                path: 'Lib',
                element: (
                    <Suspense fallback={<LoadingPage />}>
                        <LibPage />
                    </Suspense>
                ),
                errorElement: <ErrorPage />,
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
                path: 'upload',
                element: (
                    <Suspense fallback={<LoadingPage />}>
                        <UploadPage />
                    </Suspense>
                ),
                errorElement: <ErrorPage />,
            },
            {
                path: 'progress',
                element: (
                    <Suspense fallback={<LoadingPage />}>
                        <ProgressPage />
                    </Suspense>
                ),
                errorElement: <ErrorPage />,
            },
            {
                path: 'friends',
                element: (
                    <Suspense fallback={<LoadingPage />}>
                        <FriendsPage />
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
