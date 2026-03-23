import React, { useState } from 'react';
import { buildPath } from './Path';
import { storeToken } from '../tokenStorage';
import { jwtDecode, type JwtPayload } from 'jwt-decode';

type AppTokenPayload = JwtPayload & {
    userId?: number;
    firstName?: string;
    lastName?: string;
};

function Login()
{
    const [message, setMessage] = useState('');
    const [loginName, setLoginName] = React.useState('');
    const [loginPassword, setPassword] = React.useState('');

    const [registerFirstName, setRegisterFirstName] = React.useState('');
    const [registerLastName, setRegisterLastName] = React.useState('');
    const [registerLogin, setRegisterLogin] = React.useState('');
    const [registerPassword, setRegisterPassword] = React.useState('');
    const [registerMessage, setRegisterMessage] = React.useState('');

    function handleSetLoginName( e: any ) : void
    {
        setLoginName( e.target.value );
    }

    function handleSetPassword( e: any ) : void
    {
        setPassword( e.target.value );
    }

    async function doLogin(event:any) : Promise<void>
    {
        event.preventDefault();
        var obj = {login:loginName,password:loginPassword};
        var js = JSON.stringify(obj);
        try
        {
            const response = await fetch(buildPath('api/login'),
            {method:'POST',body:js,headers:{'Content-Type': 'application/json'}});

            var res = JSON.parse(await response.text());
            const accessToken = res?.accessToken;
            if (typeof accessToken !== 'string' || accessToken.length === 0)
            {
                setMessage(res?.error ?? 'Login failed. No token returned.');
                return;
            }

            storeToken( accessToken );
            const decoded = jwtDecode<AppTokenPayload>(accessToken);

            try
            {
                var ud = decoded;
                var userId = ud.userId ?? 0;
                var firstName = ud.firstName ?? '';
                var lastName = ud.lastName ?? '';
                if( userId <= 0 )
                {
                    setMessage('User/Password combination incorrect');
                }
                else
                {
                    var user = {firstName:firstName,lastName:lastName,id:userId}
                    localStorage.setItem('user_data', JSON.stringify(user));
                    setMessage('');
                    window.location.href = '/cards';
                }
            }
            catch(e)
            {
                console.log( e );
                return;
            }
        }
        catch(error:any)
        {
            alert(error.toString());
            return;
        }
    };

    async function doRegister(event:any) : Promise<void>
    {
        event.preventDefault();
        setRegisterMessage('');

        const firstName = registerFirstName.trim();
        const lastName = registerLastName.trim();
        const login = registerLogin.trim();
        const password = registerPassword;

        if (!firstName || !lastName || !login || !password)
        {
            setRegisterMessage('All fields are required.');
            return;
        }

        try
        {
            const response = await fetch(buildPath('api/register'),
            {
                method:'POST',
                body: JSON.stringify({ firstName, lastName, login, password }),
                headers:{'Content-Type': 'application/json'}
            });

            const res = JSON.parse(await response.text());
            if (res?.error)
            {
                setRegisterMessage(res.error);
                return;
            }

            setRegisterMessage('Account created. You can now log in.');
            setLoginName(login);
            setPassword('');
            setRegisterFirstName('');
            setRegisterLastName('');
            setRegisterLogin('');
            setRegisterPassword('');
        }
        catch(error:any)
        {
            setRegisterMessage(error.toString());
        }
    }

    return(
        <div id="loginDiv">
            <span id="inner-title">PLEASE LOG IN</span><br />
            Login: <input type="text" id="loginName" placeholder="Username"
            value={loginName} onChange={handleSetLoginName} /><br />
            Password: <input type="password" id="loginPassword" placeholder="Password"
            value={loginPassword} onChange={handleSetPassword} /><br />
            <input type="submit" id="loginButton" className="buttons" value = "Do It"
             onClick={doLogin} />
            <span id="loginResult">{message}</span>

            <hr style={{ margin: '20px 0' }} />
            <span id="register-title">CREATE ACCOUNT</span><br />
            First Name: <input type="text" id="registerFirstName" placeholder="First name"
            value={registerFirstName} onChange={(e) => setRegisterFirstName(e.target.value)} /><br />
            Last Name: <input type="text" id="registerLastName" placeholder="Last name"
            value={registerLastName} onChange={(e) => setRegisterLastName(e.target.value)} /><br />
            Username: <input type="text" id="registerLogin" placeholder="Username"
            value={registerLogin} onChange={(e) => setRegisterLogin(e.target.value)} /><br />
            Password: <input type="password" id="registerPassword" placeholder="Password"
            value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} /><br />
            <input type="submit" id="registerButton" className="buttons" value="Create Account"
            onClick={doRegister} />
            <span id="registerResult">{registerMessage}</span>
        </div>
    );
};

export default Login;