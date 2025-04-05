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
		const isTextContent = typeof label === 'string';
		isTextContent 
			? this._el_label.innerText  = label 
			: this._el_label = mount(this.container, label, this._el_label, true);
	}

	_ui_render  = () => {
		const { label: displayText } = this._prop;
		return (
			<label className="form-label">
				<span this='_el_label'>{displayText}</span>
				<input this='_el_input' type="text" className="form-control" />
			</label>
		)
	}

	getValue  = () => {
		const inputValue = this._el_input.value;
		console.log(inputValue);
		return inputValue;
	};
}
