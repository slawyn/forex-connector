import Api from "src/Api";

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
                new Api().postCommand({ command: 'select', data: this.instrument })
                this.selected = true;
            } else if (this.selected && Object.keys(this.calculator).length > 0) {
                new Api().postCommand({ command: 'preview', data: this.calculator })
            }
        } else {
            this.selected = false;
        }
    }
}
