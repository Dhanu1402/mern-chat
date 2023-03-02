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
  const { username, id, setId, setUsername } = useContext(UserContext);

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
      // if the message is for the selected user then add it to the messages array
      if (messageData.sender === selectedUserId) {
        // display incoming message
        setMessages((prev) => [...prev, { ...messageData }]);
      }
    }
  }

  function logout() {
    axios.post('/logout').then(() => {
      setWs(null);
      setId(null);
      setUsername(null);
    });
  }

  function sendMessage(ev, file = null) {
    if (ev) ev.preventDefault(); // prevent the page from refreshing
    console.log('sending message');
    // grab websocket and send message with user details
    ws.send(
      JSON.stringify({
        recipient: selectedUserId,
        text: newMessageText,
        file,
      })
    );
    // if sending file then reload the messages
    if (file) {
      axios.get('/messages/' + selectedUserId).then((res) => {
        setMessages(res.data);
      });
    } else {
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
  }

  function sendFile(ev) {
    // read the file
    const reader = new FileReader();
    reader.readAsDataURL(ev.target.files[0]);
    //fuction will run after reading the data
    reader.onload = () => {
      sendMessage(null, {
        name: ev.target.files[0].name,
        data: reader.result,
      });
    };
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
      <div className="bg-white w-1/3 flex flex-col">
        <div className="flex-grow">
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
        <div className="p-2 text-center flex items-center justify-around">
          <span className="mr-2 text-sm text-gray-600 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6"
            >
              <path
                fillRule="evenodd"
                d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z"
                clipRule="evenodd"
              />
            </svg>
            {username}
          </span>
          <button
            onClick={logout}
            className="text-sm bg-blue-100 py-1 px-2 text-gray-500 border rounded-sm"
          >
            Logout
          </button>
        </div>
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
                      {message.file && (
                        <div>
                          <a
                            target="_blank"
                            className="flex items-center gap-1 border-b"
                            href={
                              axios.defaults.baseURL +
                              '/uploads/' +
                              message.file
                            }
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                              stroke="currentColor"
                              className="w-4 h-4"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13"
                              />
                            </svg>
                            {message.file}
                          </a>
                        </div>
                      )}
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
            {/* attachment button */}
            <label className="bg-blue-200 p-2 cursor-pointer text-gray-500 rounded-sm border border-blue-200">
              <input
                type="file"
                className="hidden"
                onChange={sendFile}
                name=""
                id=""
              />
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
                  d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13"
                />
              </svg>
            </label>
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
