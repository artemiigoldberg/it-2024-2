import { mount, el } from '../../node_modules/redom/dist/redom.es';

export default class Input {
    constructor(settings = {}) {
        const {
            label = '',
        } = settings;

        this._prop = {
            label,
        }
        this.el = this._ui_render();
    }

    updateLabel = (label) => {
        // TODO:
        console.log('input. change lang', label)
    }

    _ui_render = () => {
        const { label } = this._prop;
        return (
            <label className="form-label">{label}
                <input type="text" className="form-control" />
            </label>
        )
    }
}
