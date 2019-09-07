import React, { Component } from 'react';
import withStyles from '@material-ui/core/styles/withStyles';
import PropTypes from 'prop-types';
import AppIcon from '../images/logo.png';
import { Link } from 'react-router-dom';
// MUI Stuff
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
// Redux stuff
// import { connect } from 'react-redux';
import { loginUser } from '../redux/actions/userActions';

import axios from 'axios';

const styles = (theme) => ({ ...theme.spread });

class login extends Component {
	state = {
		email: '',
		password: '',
		errors: {}
	};
	componentDidUpdate (nextProps) {
		// if (nextProps.UI.errors) {
		// 	this.setState({ errors: nextProps.UI.errors });
		// }
	}
	handleSubmit = (event) => {
		event.preventDefault();
		const userData = {
			email: this.state.email,
			password: this.state.password
		};
		axios
			.post('/login', userData)
			.then((res) => {
				console.log(res.data);
				this.props.history.push('/');
			})
      .catch((err) => {
        console.log(err.response.data);
				this.setState({ errors: err.response.data });
			});
		// this.props.loginUser(userData, this.props.history);
	};
	handleChange = (event) => {
		this.setState({
			[event.target.name]: event.target.value
		});
	};
	render () {
		// const { classes, UI: { loading } } = this.props;
		const { classes } = this.props;
		const loading = false;
		const { errors } = this.state;

		return (
			<Grid container className={classes.form}>
				<Grid item sm />
				<Grid item sm>
					{/* <img src={AppIcon} alt='logo' width={100} height={100} className={classes.image} /> */}
					<Typography variant='h2' className={classes.pageTitle}>
						Login
					</Typography>
					<form noValidate onSubmit={this.handleSubmit}>
						<TextField
							id='email'
							name='email'
							type='email'
							label='Email'
							className={classes.textField}
							helperText={errors.email}
							error={errors.email ? true : false}
							value={this.state.email}
							onChange={this.handleChange}
							fullWidth
						/>
						<TextField
							id='password'
							name='password'
							type='password'
							label='Password'
							className={classes.textField}
							helperText={errors.password}
							error={errors.password ? true : false}
							value={this.state.password}
							onChange={this.handleChange}
							fullWidth
						/>
						{errors.general && (
							<Typography variant='body2' className={classes.customError}>
								{errors.general}
							</Typography>
						)}
						<Button type='submit' variant='contained' color='primary' className={classes.button} disabled={loading}>
							Login
							{loading && <CircularProgress size={30} className={classes.progress} />}
						</Button>
						<br />
						<small>
							Don't have an account? <Link to='/signup'>Create one!</Link>
						</small>
					</form>
				</Grid>
				<Grid item sm />
			</Grid>
		);
	}
}

// login.propTypes = {
// 	classes: PropTypes.object.isRequired,
// 	loginUser: PropTypes.func.isRequired,
// 	user: PropTypes.object.isRequired,
// 	UI: PropTypes.object.isRequired
// };

// const mapStateToProps = (state) => ({
// 	user: state.user,
// 	UI: state.UI
// });

// const mapActionsToProps = {
// 	loginUser
// };

// export default connect(mapStateToProps, mapActionsToProps)(withStyles(styles)(login));
export default withStyles(styles)(login);
