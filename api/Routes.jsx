import React, { useContext } from 'react';
import { UserContext } from '../client/src/components/UserContext';
import RegisterAndLoginFormScreen from '../client/src/screens/RegisterAndLoginFormScreen';

export default function Routes() {
  const { username, id } = useContext(UserContext);

  if (username) {
    return 'logged in! ' + username;
  }

  return <RegisterAndLoginFormScreen />;
}
