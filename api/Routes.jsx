import React, { useContext } from 'react';
import ChatScreen from '../client/src/screens/ChatScreen';
import { UserContext } from '../client/src/components/UserContext';
import RegisterAndLoginFormScreen from '../client/src/screens/RegisterAndLoginFormScreen';

export default function Routes() {
  const { username, id } = useContext(UserContext);

  if (username) {
    return <ChatScreen />;
  }

  return <RegisterAndLoginFormScreen />;
}
