import { mount, el } from '../../node_modules/redom/dist/redom.es';
import Input from '../atom/input';
import t9n from '../utils/t9n/index';
import { commonEventManager } from '../utils/eventManager';

export default class LoginAndPassFrom {

    constructor(settings = {}) {
        const {
            langId = 'ru',
        } = settings;

        this._prop = {
            langId,
        };

        this.el = this._ui_render();

        commonEventManager.subscribe('changeLang', this._eventChangeLang)
    }

    _eventChangeLang = (lang) => {
        console.log(lang)
        this._el.login.updateLabel(t9n(lang, 'LOGIN'));
        this._el.password.updateLabel(t9n(lang, 'PASSWORD'));
    }

    _ui_render = () => {
        const { langId } = this._prop;

        return (
            <div className='d-flex flex-column'>
                <Input this='_el_login' label={t9n(langId, 'LOGIN')} />
                <Input this='_el_password' label={t9n(langId, 'PASSWORD')} />
            </div>
        )
    }
	
	getEmailAddress = () => {
		const emailInput = this._el_login.getValue();
		console.log('Email obtained:', emailInput);
		return emailInput;
	}

	getPassCode = () => {
		const Pass = this._el_password.getValue();
		console.log('Password retrieved:', Pass);
		return Pass;
	}
}
