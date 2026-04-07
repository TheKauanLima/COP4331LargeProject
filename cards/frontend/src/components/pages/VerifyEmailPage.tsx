import { useEffect, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { buildPath } from '../Path';

function VerifyEmailPage() {
    const [searchParams] = useSearchParams();
    const [message, setMessage] = useState<string>('Verifying your email...');
    const [isError, setIsError] = useState<boolean>(false);
    const hasRequested = useRef<boolean>(false);

    useEffect(() => {
        if (hasRequested.current) {
            return;
        }
        hasRequested.current = true;

        const verifyEmail = async () => {
            const token = searchParams.get('token');

            if (!token) {
                setIsError(true);
                setMessage('Missing verification token.');
                return;
            }

            try {
                const response = await fetch(buildPath('api/verify-email'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token })
                });

                const res = JSON.parse(await response.text());
                if (res?.error) {
                    setIsError(true);
                    setMessage(res.error);
                    return;
                }

                setIsError(false);
                setMessage(res?.message ?? 'Email verified successfully.');
            } catch (error: any) {
                setIsError(true);
                setMessage(error.toString());
            }
        };

        verifyEmail();
    }, [searchParams]);

    return (
        <div id="verifyEmailDiv">
            <h2>Email Verification</h2>
            <p style={{ color: isError ? '#b00020' : '#0a7a2f' }}>{message}</p>
            <Link to="/">Go back to Login</Link>
        </div>
    );
}

export default VerifyEmailPage;
