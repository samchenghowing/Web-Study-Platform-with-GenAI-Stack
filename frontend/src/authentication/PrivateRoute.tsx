import * as React from "react";
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';
import LoadingPage from '../pages/LoadingPage';

interface PrivateRouteProps {
    children?: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return <LoadingPage />;
    }

    if (!user) {
        // Redirect to the sign-in page if not authenticated
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default PrivateRoute;
