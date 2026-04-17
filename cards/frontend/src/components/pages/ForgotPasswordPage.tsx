import { useState, type ChangeEvent, type MouseEvent } from 'react';
import { buildPath } from '../Path';
import { Link } from 'react-router-dom';

function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [email, setEmail] = useState<string>('');
    const [message, setMessage] = useState<string>('');
    const [success, setSuccess] = useState<boolean>(false);

    const handleEmailChange = (e: ChangeEvent<HTMLInputElement>): void => {
        setEmail(e.target.value);
    };

    const handleSubmit = async (event: MouseEvent<HTMLButtonElement>): Promise<void> => {
        event.preventDefault();
        setIsLoading(true);
        setMessage('');

        const emailTrimmed = email.trim().toLowerCase();

        if (!emailTrimmed) {
            setMessage('Please enter your email address.');
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch(buildPath('api/forgot-password'), {
                method: 'POST',
                body: JSON.stringify({ email: emailTrimmed }),
                headers: { 'Content-Type': 'application/json' }
            });

            const res = JSON.parse(await response.text());

            if (res?.error) {
                setMessage(res.error);
                setSuccess(false);
                setIsLoading(false);
                return;
            }

            setMessage(res?.message ?? 'If this email exists in our system, you will receive a password reset link.');
            setSuccess(true);
            setEmail('');
        } catch (error: any) {
            setMessage(error.toString());
            setSuccess(false);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="film-auth-page">
            <h1 className="main-logo">FilmBuff</h1>

            <div className="auth-card" style={{ maxWidth: '450px', display: 'flex', justifyContent: 'center' }}>
                <div className="auth-section" style={{ flex: 'none', width: '100%', padding: '2.5rem', boxSizing: 'border-box' }}>
                    <h2 className="auth-title">Forgot Password</h2>
                    <p className="auth-subtitle">Enter your email address and we'll send you a link to reset your password.</p>

                    <form className="auth-form">
                        <input
                            type="email"
                            className="form-input"
                            placeholder="Email Address"
                            value={email}
                            onChange={handleEmailChange}
                            disabled={isLoading || success}
                        />

                        {!success && (
                            <button
                                className="auth-btn primary-btn"
                                onClick={handleSubmit}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Sending...' : 'Send Reset Link'}
                            </button>
                        )}

                        <span
                            className="auth-msg"
                            style={{
                                color: success ? '#4caf50' : '#d32f2f',
                                marginTop: '1rem'
                            }}
                        >
                            {message}
                        </span>

                        <Link
                            to="/"
                            style={{
                                textAlign: 'center',
                                display: 'block',
                                marginTop: '1.5rem',
                                color: '#555',
                                textDecoration: 'none',
                                fontSize: '0.9rem'
                            }}
                        >
                            Back to Login
                        </Link>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default ForgotPasswordPage;