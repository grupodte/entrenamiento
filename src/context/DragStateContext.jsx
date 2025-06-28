import React, { createContext, useState, useContext } from 'react';

const DragStateContext = createContext();

export const useDragState = () => {
    const context = useContext(DragStateContext);
    if (context === undefined) {
        // This can happen if useDragState is used outside of DragStateProvider.
        // It's fine if AdminLayout uses it and a page without DND is rendered,
        // in which case isDragging should default to false.
        return { isDragging: false, setIsDragging: () => { } };
    }
    return context;
};

export const DragStateProvider = ({ children }) => {
    const [isDragging, setIsDragging] = useState(false);

    return (
        <DragStateContext.Provider value={{ isDragging, setIsDragging }}>
            {children}
        </DragStateContext.Provider>
    );
};
