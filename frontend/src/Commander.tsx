import { createPostRequest } from "./utils";

interface Calculator {
    ask?: number;
    bid?: number;
    sl?: number;
    tp?: number;
}

interface SetCommandProps {
    preview?: boolean;
    calculator?: Calculator;
    instrument?: string;
}

export default class Commander {
    private instrument: string;
    private selected: boolean;
    private preview: boolean;
    private calculator: Calculator;

    constructor() {
        this.instrument = "";
        this.selected = false;
        this.preview = false;
        this.calculator = {};
    }

    setCommand(props: SetCommandProps): void {
        if (props.preview !== undefined) {
            this.preview = props.preview;
        }

        if (props.calculator !== undefined) {
            this.calculator.ask = props.calculator.ask;
            this.calculator.bid = props.calculator.bid;
            this.calculator.sl = props.calculator.sl;
            this.calculator.tp = props.calculator.tp;
        }

        if (props.instrument !== undefined) {
            this.instrument = props.instrument;
            this.selected = false;
        }

        if (this.preview) {
            if (!this.selected && this.instrument !== "") {
                const requestOptions = createPostRequest({ command: 'select', data: this.instrument });
                fetch('/api/command', requestOptions).then(response => response.json());
                this.selected = true;
            } else if (this.selected && Object.keys(this.calculator).length > 0) {
                const requestOptions = createPostRequest({ command: 'preview', data: this.calculator });
                fetch('/api/command', requestOptions).then(response => response.json());
            }
        } else {
            this.selected = false;
        }
    }
}
