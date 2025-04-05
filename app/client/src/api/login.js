import responseState from './state';
import err from './errors';

export default function registration(body) {
    const {email, pass} = body;

    if (email === '') {
        return {
            status: responseState.failed,
            body: err.emptyEmail
        }
    }

    if (pass === '') {
        return {
            status: responseState.failed,
            body: err.emptyPassword
        }
    }

    return {
        status: responseState.ok,
        body: 'success'
    }
}