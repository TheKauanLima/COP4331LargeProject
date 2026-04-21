import { useState, type ChangeEvent, type MouseEvent } from 'react';
import { buildPath } from './Path';
import { storeToken } from '../tokenStorage';
import { jwtDecode, type JwtPayload } from 'jwt-decode';
import { Link } from 'react-router-dom';
import fbLogo from '../assets/Logo.png';

type AppTokenPayload = JwtPayload & {
    userId?: number;
    firstName?: string;
    lastName?: string;
};

function Login() {
    // --- State Management ---
    const [isLoading, setIsLoading] = useState<boolean>(false);
    
    // Login State
    const [message, setMessage] = useState<string>('');
    const [loginName, setLoginName] = useState<string>('');
    const [loginPassword, setPassword] = useState<string>('');

    // Register State
    const [registerFirstName, setRegisterFirstName] = useState<string>('');
    const [registerLastName, setRegisterLastName] = useState<string>('');
    const [registerEmail, setRegisterEmail] = useState<string>('');
    const [registerLogin, setRegisterLogin] = useState<string>('');
    const [registerPassword, setRegisterPassword] = useState<string>('');
    const [registerMessage, setRegisterMessage] = useState<string>('');
    const [needsVerification, setNeedsVerification] = useState<boolean>(false);

    // --- Event Handlers (Strongly Typed) ---
    const handleSetLoginName = (e: ChangeEvent<HTMLInputElement>): void => {
        setLoginName(e.target.value);
    };

    const handleSetPassword = (e: ChangeEvent<HTMLInputElement>): void => {
        setPassword(e.target.value);
    };

    // --- API Calls ---
    const doLogin = async (event: MouseEvent<HTMLButtonElement>): Promise<void> => {
        event.preventDefault();
        setIsLoading(true);
        setMessage('');

        const obj = { login: loginName, password: loginPassword };
        const js = JSON.stringify(obj);

        try {
            const response = await fetch(buildPath('api/login'), {
                method: 'POST',
                body: js,
                headers: { 'Content-Type': 'application/json' }
            });

            const res = JSON.parse(await response.text());
            if (res?.verificationRequired) {
                setNeedsVerification(true);
                setMessage(res?.error ?? 'Please verify your email before logging in.');
                setIsLoading(false);
                return;
            }

            setNeedsVerification(false);
            const accessToken = res?.accessToken;

            if (typeof accessToken !== 'string' || accessToken.length === 0) {
                setMessage(res?.error ?? 'Login failed. No token returned.');
                setIsLoading(false);
                return;
            }

            storeToken(accessToken);
            const decoded = jwtDecode<AppTokenPayload>(accessToken);

            try {
                const userId = decoded.userId ?? 0;
                const firstName = decoded.firstName ?? '';
                const lastName = decoded.lastName ?? '';

                if (userId <= 0) {
                    setMessage('User/Password combination incorrect');
                } else {
                    const user = { firstName, lastName, id: userId };
                    localStorage.setItem('user_data', JSON.stringify(user));
                    setMessage('');
                    window.location.href = '/dashboard';
                }
            } catch (e) {
                console.error("Token decoding error:", e);
                setMessage('Error processing user token.');
            }
        } catch (error: any) {
            setMessage(error.toString());
        } finally {
            setIsLoading(false);
        }
    };

    const doRegister = async (event: MouseEvent<HTMLButtonElement>): Promise<void> => {
        event.preventDefault();
        setIsLoading(true);
        setRegisterMessage('');

        const firstName = registerFirstName.trim();
        const lastName = registerLastName.trim();
        const email = registerEmail.trim().toLowerCase();
        const login = registerLogin.trim();
        const password = registerPassword;

        if (!firstName || !lastName || !email || !login || !password) {
            setRegisterMessage('All fields are required.');
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch(buildPath('api/register'), {
                method: 'POST',
                body: JSON.stringify({ firstName, lastName, email, login, password }),
                headers: { 'Content-Type': 'application/json' }
            });

            const res = JSON.parse(await response.text());
            
            if (res?.error) {
                setRegisterMessage(res.error);
                setIsLoading(false);
                return;
            }

            setRegisterMessage(res?.message ?? 'Account created. Please verify your email.');
            setLoginName(login);
            setPassword('');
            setRegisterFirstName('');
            setRegisterLastName('');
            setRegisterEmail('');
            setRegisterLogin('');
            setRegisterPassword('');
        } catch (error: any) {
            setRegisterMessage(error.toString());
        } finally {
            setIsLoading(false);
        }
    };

    const doResendVerification = async (event: MouseEvent<HTMLButtonElement>): Promise<void> => {
        event.preventDefault();
        setIsLoading(true);
        setMessage('');

        const loginOrEmail = loginName.trim();
        if (!loginOrEmail) {
            setMessage('Enter your username or email to resend verification.');
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch(buildPath('api/resend-verification'), {
                method: 'POST',
                body: JSON.stringify({ loginOrEmail }),
                headers: { 'Content-Type': 'application/json' }
            });

            const res = JSON.parse(await response.text());
            if (res?.error) {
                setMessage(res.error);
                setIsLoading(false);
                return;
            }

            setMessage(res?.message ?? 'Verification email sent.');
        } catch (error: any) {
            setMessage(error.toString());
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="film-auth-page">
            
            {/* NEW PLACEMENT: Title at the very top of the page */}
            <img src={fbLogo} alt="FilmBuffs Logo" className="main-logo" />

            <div className="auth-card">
                
                {/* LOGIN SECTION */}
                <div className="auth-section">
                    <h2 className="auth-title">Welcome Back</h2>
                    <p className="auth-subtitle">Please log in to continue.</p>
                    
                    <form className="auth-form">
                        <input type="text" className="form-input" placeholder="Username" value={loginName} onChange={handleSetLoginName} disabled={isLoading} />
                        <input type="password" className="form-input" placeholder="Password" value={loginPassword} onChange={handleSetPassword} disabled={isLoading} />
                        
                        <button className="auth-btn primary-btn" onClick={doLogin} disabled={isLoading}>
                            {isLoading ? "Loading..." : "Log In"}
                        </button>
                        
                        <Link to="/forgot-password" style={{ textAlign: 'center', display: 'block', marginTop: '1rem', color: '#555', textDecoration: 'none', fontSize: '0.9rem' }}>
                            Forgot Password?
                        </Link>
                        
                        {needsVerification && (
                            <button className="auth-btn secondary-btn mt-2" onClick={doResendVerification} disabled={isLoading}>
                                {isLoading ? 'Loading...' : 'Resend Verification Email'}
                            </button>
                        )}
                        <span className="auth-msg">{message}</span>
                    </form>
                </div>

                {/* DIVIDER */}
                <div className="auth-divider"></div>

                {/* REGISTER SECTION */}
                <div className="auth-section">
                    <h2 className="auth-title">Create Account</h2>
                    <p className="auth-subtitle">New here? Sign up for free.</p>
                    
                    <form className="auth-form">
                        <div className="form-row">
                            <input type="text" className="form-input" placeholder="First Name" value={registerFirstName} onChange={(e) => setRegisterFirstName(e.target.value)} disabled={isLoading} />
                            <input type="text" className="form-input" placeholder="Last Name" value={registerLastName} onChange={(e) => setRegisterLastName(e.target.value)} disabled={isLoading} />
                        </div>
                        <input type="email" className="form-input" placeholder="Email Address" value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} disabled={isLoading} />
                        <input type="text" className="form-input" placeholder="Username" value={registerLogin} onChange={(e) => setRegisterLogin(e.target.value)} disabled={isLoading} />
                        <input type="password" className="form-input" placeholder="Password" value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} disabled={isLoading} />
                        
                        <button className="auth-btn primary-btn" onClick={doRegister} disabled={isLoading}>
                            {isLoading ? "Loading..." : "Create Account"}
                        </button>
                        <span className="auth-msg">{registerMessage}</span>
                    </form>
                </div>

            </div>
        </main>
    );
}

export default Login;