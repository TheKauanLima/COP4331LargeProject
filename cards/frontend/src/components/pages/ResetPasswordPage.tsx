import { useState, type ChangeEvent, type MouseEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { buildPath } from '../Path';
import { Link } from 'react-router-dom';

function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [newPassword, setNewPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [message, setMessage] = useState<string>('');
    const [success, setSuccess] = useState<boolean>(false);

    const handleNewPasswordChange = (e: ChangeEvent<HTMLInputElement>): void => {
        setNewPassword(e.target.value);
    };

    const handleConfirmPasswordChange = (e: ChangeEvent<HTMLInputElement>): void => {
        setConfirmPassword(e.target.value);
    };

    const handleSubmit = async (event: MouseEvent<HTMLButtonElement>): Promise<void> => {
        event.preventDefault();
        setIsLoading(true);
        setMessage('');

        if (!token) {
            setMessage('Invalid reset link. Please request a new password reset.');
            setIsLoading(false);
            return;
        }

        if (!newPassword || !confirmPassword) {
            setMessage('Please enter both password fields.');
            setIsLoading(false);
            return;
        }

        if (newPassword !== confirmPassword) {
            setMessage('Passwords do not match.');
            setIsLoading(false);
            return;
        }

        if (newPassword.length < 6) {
            setMessage('Password must be at least 6 characters long.');
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch(buildPath('api/reset-password'), {
                method: 'POST',
                body: JSON.stringify({ token, newPassword }),
                headers: { 'Content-Type': 'application/json' }
            });

            const res = JSON.parse(await response.text());

            if (res?.error) {
                setMessage(res.error);
                setSuccess(false);
                setIsLoading(false);
                return;
            }

            setMessage(res?.message ?? 'Your password has been reset successfully.');
            setSuccess(true);
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            setMessage(error.toString());
            setSuccess(false);
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="film-auth-page">
                <h1 className="main-logo">FilmBuffs</h1>

                <div className="auth-card" style={{ maxWidth: '450px', display: 'flex', justifyContent: 'center' }}>
                    <div className="auth-section" style={{ flex: 'none', width: '100%' }}>
                        <h2 className="auth-title">Invalid Reset Link</h2>
                        <p className="auth-subtitle">The password reset link is missing or invalid.</p>

                        <div className="auth-form">
                            <span className="auth-msg" style={{ color: '#d32f2f' }}>
                                Please request a new password reset.
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
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="film-auth-page">
            <h1 className="main-logo">FilmBuffs</h1>

            <div className="auth-card" style={{ maxWidth: '450px', display: 'flex', justifyContent: 'center' }}>
                <div className="auth-section" style={{ flex: 'none', width: '100%' }}>
                    <h2 className="auth-title">Reset Password</h2>
                    <p className="auth-subtitle">Enter your new password below.</p>

                    <form className="auth-form">
                        <input
                            type="password"
                            className="form-input"
                            placeholder="New Password"
                            value={newPassword}
                            onChange={handleNewPasswordChange}
                            disabled={isLoading || success}
                        />

                        <input
                            type="password"
                            className="form-input"
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChange={handleConfirmPasswordChange}
                            disabled={isLoading || success}
                        />

                        {!success && (
                            <button
                                className="auth-btn primary-btn"
                                onClick={handleSubmit}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Resetting...' : 'Reset Password'}
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

                        {success && (
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
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
}

export default ResetPasswordPage;