import { mount, el } from '../../node_modules/redom/dist/redom.es';
import LoginAndPassFrom from '../widget/loginAndPassFrom';
import Button from '../atom/button';
import t9n from '../utils/t9n/index';
import { commonEventManager } from '../utils/eventManager';
import fetch from '../api/index';

export default class LoginForm {
    constructor(settings = {}) {
		const {
            langId = 'ru',
        } = settings;


        this._prop = {
            langId,
        };

        this.el = this._ui_render();

        commonEventManager.subscribe('changeLang', this._eventChangeLang);
    }

	_onBtnClick = () => {
        const { langId } = this._prop;
        const newLang = langId === 'ru' ? 'en' : 'ru';
        commonEventManager.dispatch('changeLang', newLang);
        this._prop.langId = newLang;
    }

    _ui_render = () => {
        const { langId } = this._prop;
        return (
            <div className='d-flex flex-column'>
                <LoginAndPassForm this='_el_form_login' langId={langId} />
                <Button this='_el_button_to_login_page' title={t9n(langId, 'TO_LOGIN_PAGE')} className='btn btn-primary' onClick={this._onBtnClickLogin} />
                <Button this='_el_button_sign_up' title={t9n(langId, 'REG_PAGE')} className='btn btn-secondary' onClick={this._onBtnClickSignUp} />
            </div>
        )
    }

    _eventChangeLang = (lang) => {
        this._el_button_to_login_page.update({'text':t9n(lang, 'TO_LOGIN_PAGE')});
        this._el_button_sign_up.update({'text':t9n(lang, 'REG_PAGE')});
    }

    _onBtnClickLogin = () => {
        const email = this._el_form_login.getEmail();
        const pass = this._el_form_login.getPassword();
        console.log(fetch('api/v1/login', {email, pass}));
    }
}