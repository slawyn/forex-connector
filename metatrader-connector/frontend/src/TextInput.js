import React, { useRef } from "react";


const TextInput = ({ name, customClass }) => {
    const textRef = useRef(null);
    return (
        <form>
            <label for="fname">First name:</label>
            <input type="text" id="fname" name="fname" className="mystyle" />
        </form>
    );
};


export { TextInput as default };
