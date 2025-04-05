import login from './login';
import registration from './registration';
import responseState from './state';

export default function my_fetch(url, body) {
    switch(url) {
        case 'api/v1/login':
            return login(body);
        case 'api/v1/registration':
            return registration(body);
        default:
            return {
                status: responseState.sys_error,
                body: "system error"
            }
    }
}