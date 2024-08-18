import * as React from 'react';
import { useState, useRef } from 'react';
import { styled } from '@mui/material/styles';

const ResizableContainer = styled('div')({
    display: 'flex',
    alignItems: 'stretch',
    position: 'relative',
});

const ResizableContent = styled('div')({
    flexGrow: 1,
    overflow: 'hidden',
});

const Resizer = styled('div')({
    width: '5px',
    cursor: 'ew-resize',
    backgroundColor: '#fff',
    height: '100%',
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 1,
    transition: 'background-color 0.2s',
    '&:hover': {
        backgroundColor: '#555',
    },
});

interface ResizablePanelProps {
    children: React.ReactNode;
    minWidth?: number;
    maxWidth?: number;
    width: number;
    onWidthChange: (newWidth: number) => void;
}

const ResizablePanel: React.FC<ResizablePanelProps> = ({
    children,
    minWidth = 100,
    maxWidth = 600,
    width,
    onWidthChange,
}) => {
    const [dragging, setDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = (e: React.MouseEvent) => {
        setDragging(true);
        e.preventDefault(); // Prevent text selection while dragging
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (dragging && containerRef.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            const newWidth = Math.min(Math.max(e.clientX - containerRect.left, minWidth), maxWidth);
            onWidthChange(newWidth);
        }
    };

    const handleMouseUp = () => {
        setDragging(false);
    };

    React.useEffect(() => {
        if (dragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        } else {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        }
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dragging]);

    return (
        <ResizableContainer ref={containerRef}>
            <ResizableContent style={{ width }}>
                {children}
            </ResizableContent>
            <Resizer onMouseDown={handleMouseDown} />
        </ResizableContainer>
    );
};

export default ResizablePanel;
