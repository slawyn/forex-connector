import React from "react";

  const MiscCheckbox = ({ customClass, text, handler }) => {
    const btnRef = React.useRef(null)
    const [state, setState] = React.useState(false);

    function onToggle() {
      const new_state = !state
      if (new_state) {
        btnRef.current.className += " active"
      }
      else {
        btnRef.current.className = btnRef.current.className.replace(" active", "")
      }

      setState(new_state)
      if (handler) {
        handler(new_state)
      }
    }
    return <button ref={btnRef} className={customClass} onClick={onToggle}>{text}</button>
  }

  export default MiscCheckbox;