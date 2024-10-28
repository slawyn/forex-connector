import * as React from 'react';
import MiscCheckbox from 'src/elements/Misc';

interface Handlers {
    enableSimulation: (state:boolean) => void;
    executeSimulationStep: () => void;
    enableTrading: (state:boolean) => void;
    
}

interface ControlPanelProps {
    customClass: string;
    handlers: Handlers;
}


export const ControlPanel: React.FC<ControlPanelProps> =  ({ customClass, handlers}) => {
    return (
        <table className={customClass}>
            <thead>
                <tr>
                    <th title="Enables simulation mode" className={customClass}>
                        <MiscCheckbox customClass={"css-button-checkbox"}
                            text ="Enable Simulation"
                            handler={(state) => {
                                handlers.enableSimulation(state);
                            }}
                        />
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr key="order-row">
                    <td>
                        
                    </td>
                </tr>
            </tbody>
        </table>
    );
};

