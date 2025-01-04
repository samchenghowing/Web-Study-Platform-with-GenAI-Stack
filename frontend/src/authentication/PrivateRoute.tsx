import * as React from "react";
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import LoadingPage from '../pages/LoadingPage';
import MainPage from '../pages/MainPage';

interface PrivateRouteProps {
    children?: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <LoadingPage />;
    }

    if (!user) {
        // Redirect to the sign-in page if not authenticated
        return <Navigate to="/" replace />;
    }

    return <MainPage>{children}</MainPage>;
};

export default PrivateRoute;
