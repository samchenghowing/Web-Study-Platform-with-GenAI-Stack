import * as React from "react";
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

interface PrivateRouteProps {
    children?: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = () => {
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        // Redirect to the sign-in page if not authenticated
        return <Navigate to="/signin" replace />;
    }

    return <Outlet />;
};

export default PrivateRoute;
