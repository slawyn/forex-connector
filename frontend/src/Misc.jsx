import React, { useState, useRef } from "react";

const MiscCheckbox = ({ customClass, text, handler }) => {
  const btnRef = useRef(null);
  const [isActive, setIsActive] = useState(false);

  const onToggle = () => {
    const newState = !isActive;

    if (btnRef.current) {
      if (newState) {
        btnRef.current.classList.add("active");
      } else {
        btnRef.current.classList.remove("active");
      }
    }

    setIsActive(newState);

    if (handler) {
      handler(newState);
    }
  };

  return (
    <button
      ref={btnRef}
      className={`${customClass} ${isActive ? "active" : ""}`}
      onClick={onToggle}
    >
      {text}
    </button>
  );
};

export default MiscCheckbox;
