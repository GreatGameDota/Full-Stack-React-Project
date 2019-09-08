import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import './App.css';
import MuiThemeProvider from '@material-ui/core/styles/MuiThemeProvider';
import createMuiTheme from '@material-ui/core/styles/createMuiTheme';
import jwtDecode from 'jwt-decode';
// Redux
import { Provider } from 'react-redux';
import store from './redux/store';
import { SET_AUTHENTICATED } from './redux/types';
import { logoutUser, getUserData } from './redux/actions/userActions';
// Components
import Navbar from './components/layout/Navbar';
import themeObject from './util/theme';
import AuthRoute from './util/AuthRoute';
// Pages
import home from './pages/home';
import login from './pages/login';
import signup from './pages/signup';
// import user from './pages/user';

import axios from 'axios';

// axios.defaults.baseURL = 'https://us-central1-fullstackproject-c76f0.cloudfunctions.net/api';

const theme = createMuiTheme(themeObject);

const token = localStorage.FBIdToken;
let authenticated = false;
if (token) {
	const decodedToken = jwtDecode(token);
	if (decodedToken.exp * 1000 < Date.now()) {
		store.dispatch(logoutUser());
		window.location.href = '/login';
	} else {
		store.dispatch({ type: SET_AUTHENTICATED });
		axios.defaults.headers.common['Authorization'] = token;
		authenticated = true;
		store.dispatch(getUserData());
	}
}

class App extends Component {
	render () {
		return (
			<MuiThemeProvider theme={theme}>
				<Provider store={store}>
					<Router>
						<Navbar />
						<div className='container'>
							<Switch>
								<Route exact path='/' component={home} />
								<AuthRoute exact path='/login' component={login} authenticated={authenticated} />
								<AuthRoute exact path='/signup' component={signup} authenticated={authenticated} />
								{/* <Route exact path='/users/:handle' component={user} /> */}
								{/* <Route exact path='/users/:handle/post/:postId' component={user} /> */}
							</Switch>
						</div>
					</Router>
				</Provider>
			</MuiThemeProvider>
		);
	}
}

export default App;
