import { createPostRequest } from "./utils";

export default class Commander {
  constructor() {
    this.instrument = ""
    this.selected = false
    this.preview = false
    this.calculator = {}
  }

  setCommand(props) {
    if (props.preview !== undefined) {
      this.preview = props.preview
    }

    if (props.calculator !== undefined) {
      this.calculator.ask = props.calculator.ask
      this.calculator.bid = props.calculator.bid
      this.calculator.sl = props.calculator.sl
      this.calculator.tp = props.calculator.tp
    }

    if (props.instrument !== undefined) {
      this.instrument = props.instrument
      this.selected = false
    }

    if (this.preview) {
      if (!this.selected && this.instrument !== "") {
        const requestOptions = createPostRequest({ 'command': 'select', data: this.instrument })
        fetch('/command', requestOptions).then(response => response.json())
        this.selected = true
      } else if (this.selected && Object.keys(this.calculator).length > 0) {
        const requestOptions = createPostRequest({ 'command': 'preview', data: this.calculator })
        fetch('/command', requestOptions).then(response => response.json())
      }
    }
    else {
      this.selected = false
    }
  }
}
