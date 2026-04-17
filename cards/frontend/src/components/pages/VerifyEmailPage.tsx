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
        <div className="film-auth-page">
            
            <h1 className="main-logo">FilmBuff</h1>

            <div className="auth-card" style={{ maxWidth: '500px', textAlign: 'center' }}>
                <div className="auth-section">
                    <h2 className="auth-title">Email Verification</h2>
                    
                    {/* Status Message */}
                    <div style={{ margin: '2rem 0', minHeight: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <p style={{ 
                            fontSize: '1.1rem', 
                            fontWeight: '500', 
                            // Gray while loading, Red for error, Green for success
                            color: message === 'Verifying your email...' ? '#444' : (isError ? '#d32f2f' : '#0a7a2f') 
                        }}>
                            {message}
                        </p>
                    </div>

                    {/* Styled Link to look like a button */}
                    <Link 
                        to="/" 
                        className="auth-btn primary-btn" 
                        style={{ textDecoration: 'none', display: 'block', boxSizing: 'border-box' }}
                    >
                        Return to Login
                    </Link>
                </div>
            </div>
            
        </div>
    );
}

export default VerifyEmailPage;
