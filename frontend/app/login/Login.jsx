import { API } from "../lib/api";

const Login = () => {
    return (
        <a href={`${API}/auth/login`}>
            <button>Login with Spotify</button>
        </a>
    );
}

export default Login;