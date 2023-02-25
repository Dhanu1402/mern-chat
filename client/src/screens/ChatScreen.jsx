import React, { useContext, useEffect, useState } from 'react';
import Avatar from '../components/Avatar';
import Logo from '../components/Logo';
import { UserContext } from '../components/UserContext';

export default function Chat() {
  const [ws, setWs] = useState(null);

  const [onlinePeople, setOnlinePeople] = useState([]);

  const [selectedUserId, setSelectedUserId] = useState(null);

  // grab our user
  const { username, id } = useContext(UserContext);

  //making connection with the server through websockets
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:4000');
    setWs(ws);
    // things that will happen when we recieve a message
    ws.addEventListener('message', handleMessage);
  }, []);

  function showOnlinePeople(peopleArray) {
    const people = {};
    peopleArray.forEach(({ userId, username }) => {
      people[userId] = username;
    });
    setOnlinePeople(people);
  }

  function handleMessage(ev) {
    const messageData = JSON.parse(ev.data);
    console.log(messageData);
    if ('online' in messageData) {
      showOnlinePeople(messageData.online);
    }
  }

  const onlinePeopleExcludingMe = { ...onlinePeople };

  delete onlinePeopleExcludingMe[id];

  return (
    <div className="flex h-screen">
      <div className="bg-white w-1/3">
        <Logo />
        {Object.keys(onlinePeopleExcludingMe).map((userId) => (
          <div
            key={userId}
            onClick={() => setSelectedUserId(userId)}
            className={
              'border-b border-gray-100 flex items-center gap-1 cursor-pointer' +
              // if the userId is the same as the selectedUserId, then add the classes
              (userId === selectedUserId ? 'bg-blue-500' : '')
            }
          >
            {userId === selectedUserId && (
              <div className="w-1 bg-blue-500 h-12 rounded-r-md"></div>
            )}
            <div className="flex gap-2 py-2 pl-4 items-center">
              <Avatar username={onlinePeople[userId]} userId={userId} />
              <span className="text-gray-800">{onlinePeople[userId]}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-col bg-blue-50 w-2/3 p-2">
        <div className="flex-grow">
          {!selectedUserId && (
            <div className="flex h-full flex-grow items-center justify-center">
              <div className="text-gray-300">&larr; Select a person</div>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Type your message here"
            className="bg-white flex-grow border rounded-sm p-2"
          />
          <button className="bg-blue-500 p-2 text-white rounded-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}