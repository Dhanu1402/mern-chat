import React, { useContext, useState } from 'react';
import axios from 'axios';
import { UserContext } from '../components/UserContext';

export default function RegisterAndLoginFormScreen() {
  const [username, setUsername] = useState('');

  const [password, setPassword] = useState('');

  const [isLoginOrRegister, setIsLoginOrRegister] = useState('register');

  const { setUsername: setLoggedInUsername, setId } = useContext(UserContext);

  async function handleSubmit(ev) {
    ev.preventDefault();
    // if state is register, then register else login when login
    const url = isLoginOrRegister === 'register' ? 'register' : 'login';
    const { data } = await axios.post(url, { username, password });
    setLoggedInUsername(username);
    setId(data.id);
  }

  return (
    <div className="bg-blue-50 h-screen flex items-center">
      <form action="" onSubmit={handleSubmit} className="w-64 mx-auto mb-12">
        <input
          type="text"
          value={username}
          onChange={(ev) => setUsername(ev.target.value)}
          placeholder="username"
          className="block w-full rounded-sm p-2 mb-2 border"
        />
        <input
          type="password"
          value={password}
          onChange={(ev) => setPassword(ev.target.value)}
          placeholder="password"
          className="block w-full rounded-sm p-2 mb-2 border"
        />
        <button className="bg-blue-500 text-white block w-full rounded-sm p-2">
          {isLoginOrRegister === 'register' ? 'Register' : 'Login'}
        </button>
        <div className="text-center mt-2">
          {isLoginOrRegister === 'register' && (
            <div>
              Already a member?{''}
              <button
                className="ml-1"
                onClick={() => setIsLoginOrRegister('login')}
              >
                Login here
              </button>
            </div>
          )}
          {isLoginOrRegister === 'login' && (
            <div>
              Dont have an account?{''}
              <button
                className="ml-1"
                onClick={() => setIsLoginOrRegister('register')}
              >
                Register
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
