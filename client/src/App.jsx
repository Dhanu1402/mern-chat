import axios from 'axios';
import { UserContextProvider } from './components/UserContext';
import Routes from '../../api/Routes';

function App() {
  // defining the base URL for all axios requests
  axios.defaults.baseURL = 'http://localhost:4000';

  // set cookies from api
  axios.defaults.withCredentials = true;

  return (
    <UserContextProvider>
      <Routes />
    </UserContextProvider>
  );
}

export default App;
