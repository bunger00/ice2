import React, { useRef, useState, useEffect } from 'react';
import { Pencil, Eraser, Save, X } from 'lucide-react';

const DrawingEditor = ({ imageData, onSave, onClose, initialStrokes = [] }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState(null);
  const [image, setImage] = useState(null);
  const [strokes, setStrokes] = useState(initialStrokes);
  const [currentStroke, setCurrentStroke] = useState([]);
  const [tool, setTool] = useState('brush');
  const [brushColor, setBrushColor] = useState('#FF0000'); // Rød som standard
  const [brushSize, setBrushSize] = useState(3);
  const [lastImageData, setLastImageData] = useState(null);

  // Initialiser canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    setContext(ctx);

    // Last inn bildet
    const img = new Image();
    img.onload = () => {
      setImage(img);
      // Juster canvas-størrelse til bildet
      canvas.width = img.width;
      canvas.height = img.height;
      // Tegn bildet på canvas
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Tegn opp eksisterende strokes
      if (initialStrokes && initialStrokes.length > 0) {
        drawStrokes(initialStrokes, ctx);
      }
      
      // Lagre canvas-tilstanden med bildet og eventuelle strokes
      setLastImageData(canvas.toDataURL('image/png'));
    };
    img.src = imageData;
    
    // Fjern isDrawing state hvis musen går utenfor canvas
    const handleMouseLeave = () => setIsDrawing(false);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  // Hjelpefunksjon for å tegne lagrede strokes
  const drawStrokes = (strokesArray, ctx) => {
    if (!ctx) return;
    
    strokesArray.forEach(stroke => {
      if (stroke.points.length < 2) return;
      
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    });
  };

  // Start tegning
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    setIsDrawing(true);
    setCurrentStroke([{ x, y }]);
    
    context.beginPath();
    context.moveTo(x, y);
    context.strokeStyle = brushColor;
    context.lineWidth = brushSize;
    context.lineCap = 'round';
    context.lineJoin = 'round';
  };

  // Tegn
  const draw = (e) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    setCurrentStroke(prev => [...prev, { x, y }]);
    
    context.lineTo(x, y);
    context.stroke();
  };

  // Avslutt tegning
  const endDrawing = () => {
    if (!isDrawing) return;
    
    setIsDrawing(false);
    context.closePath();
    
    if (currentStroke.length > 1) {
      const newStroke = {
        points: currentStroke,
        color: brushColor,
        size: brushSize,
        tool: tool
      };
      
      setStrokes(prev => [...prev, newStroke]);
      setCurrentStroke([]);
      
      // Lagre den nyeste canvas-tilstanden
      setLastImageData(canvasRef.current.toDataURL('image/png'));
    }
  };

  // Lagre tegningen
  const handleSave = () => {
    if (!canvasRef.current) return;
    
    const imageData = canvasRef.current.toDataURL('image/png');
    onSave(imageData, strokes);
    console.log("Lagrer tegning med", strokes.length, "strokes");
  };

  // Bytt til annen tegneverktøy
  const changeTool = (newTool) => {
    setTool(newTool);
  };

  // Lukk editor
  const handleClose = () => {
    console.log("Lukker tegningseditor");
    // Bare send med dataene hvis det er gjort endringer (strokes legger til)
    if (strokes.length > 0 && lastImageData) {
      console.log("Sender med", strokes.length, "strokes ved lukking");
      onClose(lastImageData, strokes);
    } else {
      onClose();
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="bg-gray-800 text-white p-3 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => changeTool('brush')}
            className={`p-2 rounded-full ${tool === 'brush' ? 'bg-blue-500' : 'bg-gray-700 hover:bg-gray-600'}`}
            title="Tegn"
          >
            <Pencil size={20} />
          </button>
          <button 
            onClick={() => changeTool('eraser')}
            className={`p-2 rounded-full ${tool === 'eraser' ? 'bg-blue-500' : 'bg-gray-700 hover:bg-gray-600'}`}
            title="Viskelær"
          >
            <Eraser size={20} />
          </button>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm">Farge:</label>
            <input 
              type="color" 
              value={brushColor}
              onChange={(e) => setBrushColor(e.target.value)}
              className="w-6 h-6 rounded cursor-pointer"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm">Størrelse:</label>
            <input 
              type="range" 
              min="1" 
              max="10" 
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="w-24"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={handleSave}
            className="p-2 rounded bg-green-600 hover:bg-green-700 flex items-center"
            title="Lagre tegning"
          >
            <Save size={20} className="mr-1" />
            <span>Lagre</span>
          </button>
          <button 
            onClick={handleClose}
            className="p-2 rounded bg-gray-700 hover:bg-gray-600"
            title="Lukk editor"
          >
            <X size={20} />
          </button>
        </div>
      </div>
      
      <div className="flex-grow overflow-auto flex items-center justify-center bg-gray-900 p-2">
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full bg-white shadow-lg"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseOut={endDrawing}
          style={{ cursor: tool === 'brush' ? 'crosshair' : 'default' }}
        />
      </div>
    </div>
  );
};

export default DrawingEditor; 