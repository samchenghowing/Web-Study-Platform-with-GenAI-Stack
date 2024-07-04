import * as React from 'react';
import { useRouteError, isRouteErrorResponse } from "react-router-dom";

interface ErrorPageProps {
}

const ErrorPage: React.FC<ErrorPageProps> = () => {
    const error = useRouteError();
    console.error(error);

    let errorMessage: string;
    if (isRouteErrorResponse(error)) {
        // error is type `ErrorResponse`
        errorMessage = error.data.message || error.statusText;
    } else if (error instanceof Error) {
        errorMessage = error.message;
    } else if (typeof error === 'string') {
        errorMessage = error;
    } else {
        console.error(error);
        errorMessage = 'Unknown error';
    }


    return (
        <div id="error-page">
            <h1>Oops!</h1>
            <p>Sorry, an unexpected error has occurred.</p>
            <p className='text-slate-400'>
                <i>{errorMessage}</i>
            </p>
        </div>
    );
}

export default ErrorPage;