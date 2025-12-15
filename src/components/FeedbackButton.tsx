import { useState, useRef, useEffect } from "react";
import { MessageSquare } from "lucide-react";
import FeedbackDialog from "./FeedbackDialog";

const FeedbackButton = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Initialize position to bottom right
    setPosition({
      x: window.innerWidth - 120,
      y: window.innerHeight - 60,
    });
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (buttonRef.current && e.touches[0]) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      });
      setIsDragging(true);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: Math.max(0, Math.min(window.innerWidth - 100, e.clientX - dragOffset.x)),
          y: Math.max(0, Math.min(window.innerHeight - 40, e.clientY - dragOffset.y)),
        });
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches[0]) {
        setPosition({
          x: Math.max(0, Math.min(window.innerWidth - 100, e.touches[0].clientX - dragOffset.x)),
          y: Math.max(0, Math.min(window.innerHeight - 40, e.touches[0].clientY - dragOffset.y)),
        });
      }
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleEnd);
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("touchend", handleEnd);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [isDragging, dragOffset]);

  const handleClick = () => {
    if (!isDragging) {
      setIsDialogOpen(true);
    }
  };

  return (
    <>
      <button
        ref={buttonRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onClick={handleClick}
        className="fixed z-50 flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-black rounded-md cursor-grab transition-opacity duration-200 opacity-20 hover:opacity-100 active:cursor-grabbing select-none"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
      >
        <MessageSquare className="h-4 w-4" />
        Feedback
      </button>
      <FeedbackDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </>
  );
};

export default FeedbackButton;
