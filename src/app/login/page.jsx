'use client';

import * as React from 'react';
import classNames from 'classnames';

import AccountCircleIcon from '@mui/icons-material/AccountCircle';

import Paper from '@mui/material/Paper';
import Typography from "@mui/material/Typography"

import styles from "./styles.module.css";

import Button from "@/components/shared/button";
import Input from "@/components/Input";
import PasswordInput from '@/components/shared/password';

const Login = () => {
    const [ loading, setLoading ] = React.useState(false);

    const passwordRef = React.useRef(null);
    const usernameRef = React.useRef(null);

    const submitHandler = React.useCallback(async (e) => {
        e.preventDefault();

        setLoading(true)

        const body = JSON.stringify({ 
            password: passwordRef.current.value, 
            username: usernameRef.current.value 
        });

        const options = {
            body,
            method: "POST"
        };

        try {
            const res = await fetch('/api/auth/login', options);
            const result = await res.json();
            console.log(result);
        } catch(e) {
            console.error(e)
        } finally {
            setLoading(false)
        }

    }, []);

    return (
        <main className="bg-primary-50 flex items-center justify-center min-h-screen">
            <Paper 
                component="form"
                className={classNames(styles.form, `mx-auto px-4 py-8 rounded-xl sm:px-6`)}
                elevation={1}
                onSubmit={submitHandler}>
                <fieldset>
                    <Typography 
                        component="legend"
                        className='font-bold text-center text-2xl sm:text-3xl'
                        variant='h2'>
                        Login
                    </Typography>
                    <div className={classNames(`border border-solid border-primary-800 flex items-center mt-4 px-3 rounded-lg sm:mt-8`)}>
                        <AccountCircleIcon className="text-slate-700" />
                        <Input 
                            className="bg-primary-800 border-0 grow"
                            placeholder='Username'
                            ref={usernameRef}
                            required
                        />
                    </div>
                    <PasswordInput 
                        placeholder="Password"
                        ref={passwordRef}
                    />
                </fieldset>
                <div className='flex flex-col items-center mt-4'>
                    <Button
                        className="py-3 rounded-lg w-full"
                        type={ loading ? "button" : "submit" }>
                        { loading ? "Loading..." : "Submit" }
                    </Button>
                </div>
            </Paper>
        </main>
    )
};

export default Login;
