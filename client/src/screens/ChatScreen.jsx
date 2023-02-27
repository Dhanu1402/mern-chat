import React, { useContext, useEffect, useState, useRef } from 'react';
import Logo from '../components/Logo';
import { UserContext } from '../components/UserContext';
import uniqBy from 'lodash/uniqBy';
import axios from 'axios';
import Contact from '../components/Contact';

export default function Chat() {
  const [ws, setWs] = useState(null);

  const [onlinePeople, setOnlinePeople] = useState([]);

  const [offlinePeople, setOfflinePeople] = useState({});

  const [selectedUserId, setSelectedUserId] = useState(null);

  const [newMessageText, setNewMessageText] = useState('');

  const [messages, setMessages] = useState([]);

  // grab our user
  const { username, id } = useContext(UserContext);

  // reference for scrolling down to the bottom when new messages arrive or when the user sends a message
  const divUnderMessages = useRef();

  // auto reconnecting with websockets
  useEffect(() => {
    connectToWs();
  }, []);

  //function for making connection with the server through websockets
  function connectToWs() {
    const ws = new WebSocket('ws://localhost:4000');
    setWs(ws);
    // things that will happen when we recieve a message
    ws.addEventListener('message', handleMessage);
    // things that will happen when get disconnected and reconnect
    ws.addEventListener('close', () => {
      setTimeOut(() => {
        console.log('Disconnected. Trying to reconnect.');
        connectToWs();
      }, 1000);
    });
  }

  function showOnlinePeople(peopleArray) {
    const people = {};
    peopleArray.forEach(({ userId, username }) => {
      people[userId] = username;
    });
    setOnlinePeople(people);
  }

  function handleMessage(ev) {
    const messageData = JSON.parse(ev.data);
    console.log({ ev, messageData });
    if ('online' in messageData) {
      showOnlinePeople(messageData.online);
    } else if ('text' in messageData) {
      // display incoming message
      setMessages((prev) => [...prev, { ...messageData }]);
    }
  }

  function sendMessage(ev) {
    ev.preventDefault(); // prevent the page from refreshing
    console.log('sending message');
    // grab websocket and send message with user details
    ws.send(
      JSON.stringify({
        recipient: selectedUserId,
        text: newMessageText,
      })
    );
    // clear the input
    setNewMessageText('');
    // add the message to the messages array
    setMessages((prev) => [
      ...prev,
      {
        text: newMessageText,
        sender: id,
        recipient: selectedUserId,
        _id: Date.now(),
      },
    ]);
  }

  // check when messsages will get changed and scroll to the bottom
  useEffect(() => {
    const div = divUnderMessages.current;
    if (div) {
      div.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages]);

  // it will run everytime when online people changes
  useEffect(() => {
    axios.get('/people').then((res) => {
      const offlinePeopleArr = res.data
        .filter((p) => p._id !== id)
        .filter((p) => !Object.keys(onlinePeople).includes(p._id));
      const offlinePeople = {};
      offlinePeopleArr.forEach((p) => {
        offlinePeople[p._id] = p;
      });
      setOfflinePeople(offlinePeople);
    });
  }, [onlinePeople]);

  // check changes if selectedUserId changes
  useEffect(() => {
    if (selectedUserId) {
      // grab messages from database
      axios.get('/messages/' + selectedUserId).then((res) => {
        setMessages(res.data);
      });
    }
  }, [selectedUserId]);

  const onlinePeopleExcludingMe = { ...onlinePeople };

  delete onlinePeopleExcludingMe[id];

  // remove duplicate messages means avoid showing the same message twice
  const messagesWithoutDuplicates = uniqBy(messages, '_id');

  return (
    <div className="flex h-screen">
      <div className="bg-white w-1/3">
        <Logo />
        {Object.keys(onlinePeopleExcludingMe).map((userId) => (
          <Contact
            key={userId}
            id={userId}
            online={true}
            username={onlinePeopleExcludingMe[userId]}
            onClick={() => {
              setSelectedUserId(userId);
              console.log({ userId });
            }}
            selected={userId === selectedUserId}
          />
        ))}
        {Object.keys(offlinePeople).map((userId) => (
          <Contact
            key={userId}
            id={userId}
            online={false}
            username={offlinePeople[userId].username}
            onClick={() => setSelectedUserId(userId)}
            selected={userId === selectedUserId}
          />
        ))}
      </div>
      <div className="flex flex-col bg-blue-50 w-2/3 p-2">
        <div className="flex-grow">
          {!selectedUserId && (
            <div className="flex h-full flex-grow items-center justify-center">
              <div className="text-gray-300">&larr; Select a person</div>
            </div>
          )}

          {/* displaying the conversation b/w people */}
          {!!selectedUserId && (
            <div className="relative h-full">
              <div className="overflow-y-scroll absolute top-0 left-0 right-0 bottom-2">
                {messagesWithoutDuplicates.map((message) => (
                  <div
                    key={message._id}
                    className={
                      message.sender === id ? 'text-right' : 'text-left'
                    }
                  >
                    <div
                      className={
                        'text-left inline-block p-2 my-2 rounded-md text-sm ' +
                        (message.sender === id
                          ? 'bg-blue-500 text-white'
                          : 'bg-white text-gray-500')
                      }
                    >
                      {message.text}
                    </div>
                  </div>
                ))}
                <div ref={divUnderMessages}></div>
              </div>
            </div>
          )}
        </div>

        {/* !! -> if have, if user is not selected then disable the form */}
        {!!selectedUserId && (
          <form className="flex gap-2" onSubmit={sendMessage}>
            <input
              type="text"
              value={newMessageText}
              onChange={(ev) => setNewMessageText(ev.target.value)}
              placeholder="Type your message here"
              className="bg-white flex-grow border rounded-sm p-2"
            />
            <button
              type="submit"
              className="bg-blue-500 p-2 text-white rounded-sm"
            >
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
          </form>
        )}
      </div>
    </div>
  );
}
