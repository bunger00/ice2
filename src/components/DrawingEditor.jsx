import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Pencil, Square, Circle, ArrowUp, Save, X } from 'lucide-react';

function DrawingEditor({ imageData, onSave, onClose, initialStrokes = [] }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState(null);
  const [image, setImage] = useState(null);
  const [strokes, setStrokes] = useState(initialStrokes);
  const [currentStroke, setCurrentStroke] = useState([]);
  const [tool, setTool] = useState('pencil'); // 'pencil', 'eraser', 'rectangle', 'circle', 'arrow'
  const [brushColor, setBrushColor] = useState('#FF0000'); // Rød som standard
  const [brushSize, setBrushSize] = useState(5);
  const [lastImageData, setLastImageData] = useState(null);
  const [startPoint, setStartPoint] = useState(null); // For figurer (rektangel, sirkel, pil)
  const [color, setColor] = useState('#FF0000'); // Rød som standard
  const [strokeWidth, setStrokeWidth] = useState(5);
  const [originalImage, setOriginalImage] = useState(null);

  const colors = [
    '#FF0000', // Rød
    '#00FF00', // Grønn
    '#0000FF', // Blå
    '#FFFF00', // Gul
    '#FF00FF', // Magenta
    '#000000'  // Sort
  ];

  const penSizes = [1, 3, 6, 10]; // 4 forskjellige tykkelser

  // Initialisere canvas og laste inn bildet
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    setContext(ctx);

    const image = new Image();
    image.onload = () => {
      // Sett canvas-størrelse til å matche bildet
      canvas.width = image.width;
      canvas.height = image.height;
      
      // Tegn det originale bildet
      ctx.drawImage(image, 0, 0);
      setOriginalImage(image);
    };
    image.src = imageData;
  }, [imageData]);

  // Tegn strøkene når status endres
  useEffect(() => {
    if (!context || !originalImage) return;
    
    // Redraw canvas
    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    context.drawImage(originalImage, 0, 0);
    
    // Tegn alle lagrede strøk
    strokes.forEach(stroke => {
      if (stroke.points.length < 2) return;
      
      context.beginPath();
      context.strokeStyle = stroke.color;
      context.lineWidth = stroke.width;
      context.lineJoin = 'round';
      context.lineCap = 'round';
      
      context.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        context.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      context.stroke();
    });
  }, [context, originalImage, strokes]);

  // Sett cursor style basert på aktivt verktøy
  useEffect(() => {
    if (!canvasRef.current) return;
    
    if (tool === 'pencil') {
      canvasRef.current.style.cursor = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23000000\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z\'/%3E%3C/svg%3E") 0 24, crosshair';
    } else if (tool === 'eraser') {
      canvasRef.current.style.cursor = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23000000\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21\'/%3E%3Cpath d=\'M22 21H7\'/%3E%3Cpath d=\'m5 11 9 9\'/%3E%3C/svg%3E") 0 24, crosshair';
    }
  }, [tool]);

  // Start tegning
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    setIsDrawing(true);
    setStartPoint({ x, y }); // Lagre startpunkt for figurer
    setCurrentStroke([{ x, y }]);
    
    if (tool === 'pencil' || tool === 'brush') {
      context.beginPath();
      context.moveTo(x, y);
      context.strokeStyle = brushColor;
      context.lineWidth = brushSize;
      context.lineCap = 'round';
      context.lineJoin = 'round';
    }
  };

  // Tegn
  const draw = (e) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    setCurrentStroke(prev => [...prev, { x, y }]);
    
    if (tool === 'pencil' || tool === 'brush') {
      // Frihåndstegning
      context.lineTo(x, y);
      context.stroke();
    } else if (tool === 'eraser') {
      // Viskelær - finn og fjern streker i nærheten
      eraseStrokes(x, y, brushSize * 2);
    } else {
      // For figurer, redraw canvas og tegn preview
      redrawCanvas();
      
      // Tegn preview av figuren
      context.save();
      context.strokeStyle = brushColor;
      context.lineWidth = brushSize;
      context.lineCap = 'round';
      context.lineJoin = 'round';
      
      context.restore();
    }
  };

  // Eraser funksjonalitet
  const eraseStrokes = (x, y, radius) => {
    // Finn og fjern streker som er i nærheten av (x, y)
    const updatedStrokes = strokes.filter(stroke => {
      // Sjekk om noen punkter i streken er innenfor radius
      return !stroke.points.some(point => {
        const dx = point.x - x;
        const dy = point.y - y;
        return (dx * dx + dy * dy) <= (radius * radius);
      });
    });
    
    if (updatedStrokes.length !== strokes.length) {
      setStrokes(updatedStrokes);
      redrawCanvas();
    }
  };

  // Redraw canvas med oppdaterte streker
  const redrawCanvas = () => {
    if (!context || !image) return;
    
    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    context.drawImage(image, 0, 0, canvasRef.current.width, canvasRef.current.height);
    
    drawStrokes(strokes, context);
  };

  const endDrawing = () => {
    if (!isDrawing) return;
    
    setIsDrawing(false);
    
    if (tool === 'pencil' || tool === 'brush') {
      context.closePath();
      
      // Lagre strøket
      if (currentStroke.length > 0) {
        setStrokes(prev => [...prev, { 
          points: currentStroke, 
          color: brushColor,
          width: brushSize
        }]);
      }
    }
    
    setCurrentStroke([]);
    
    // Kall saveDrawing automatisk
    handleSave();
  };

  const handleSave = () => {
    try {
      if (!canvasRef.current) return;
      
      // Hent canvas-innholdet som data URL
      const imageData = canvasRef.current.toDataURL('image/png');
      
      console.log("Lagrer tegning med", strokes.length, "strokes");
      
      // Kall onSave med både bildedata og strokes
      onSave(imageData, strokes);
      
      // Vis bekreftelsesmelding
      alert('Tegningen er lagret!');
    } catch (error) {
      console.error('Feil ved lagring av tegning:', error);
      alert('Kunne ikke lagre tegningen. Prøv igjen.');
    }
  };

  const changeTool = (newTool) => {
    setTool(newTool);
  };

  const handleClose = () => {
    // Sørg for at alt er lagret før lukking
    handleSave();
    onClose();
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="bg-gray-800 text-white p-3 overflow-x-auto sticky top-0 z-10 flex-shrink-0">
        <div className="flex justify-between items-center min-w-max">
          <div className="flex items-center gap-4 flex-nowrap">
            {/* Tegneverktøy */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => changeTool('pencil')}
                className={`p-2 rounded-full ${tool === 'pencil' ? 'bg-blue-500' : 'bg-gray-700 hover:bg-gray-600'}`}
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
              <button 
                onClick={() => changeTool('rectangle')}
                className={`p-2 rounded-full ${tool === 'rectangle' ? 'bg-blue-500' : 'bg-gray-700 hover:bg-gray-600'}`}
                title="Rektangel"
              >
                <Square size={20} />
              </button>
              <button 
                onClick={() => changeTool('circle')}
                className={`p-2 rounded-full ${tool === 'circle' ? 'bg-blue-500' : 'bg-gray-700 hover:bg-gray-600'}`}
                title="Sirkel"
              >
                <Circle size={20} />
              </button>
              <button 
                onClick={() => changeTool('arrow')}
                className={`p-2 rounded-full ${tool === 'arrow' ? 'bg-blue-500' : 'bg-gray-700 hover:bg-gray-600'}`}
                title="Pil"
              >
                <ArrowUp size={20} />
              </button>
            </div>
            
            {/* Fargevalg */}
            <div className="flex items-center gap-2 flex-nowrap">
              <span className="text-sm whitespace-nowrap">Farge:</span>
              <div className="flex gap-1">
                {colors.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => setBrushColor(c)}
                    className={`w-6 h-6 rounded-full border ${brushColor === c ? 'border-white border-2' : 'border-gray-600'}`}
                    style={{ backgroundColor: c }}
                    title={`Farge ${i+1}`}
                  />
                ))}
                <input 
                  type="color" 
                  value={brushColor}
                  onChange={(e) => setBrushColor(e.target.value)}
                  className="w-6 h-6 rounded cursor-pointer"
                  title="Egendefinert farge"
                />
              </div>
            </div>
            
            {/* Penselstørrelse */}
            <div className="flex items-center gap-2 flex-nowrap">
              <span className="text-sm whitespace-nowrap">Størrelse:</span>
              <div className="flex gap-1">
                {penSizes.map((size, i) => (
                  <button
                    key={i}
                    onClick={() => setBrushSize(size)}
                    className={`rounded-full flex items-center justify-center ${brushSize === size ? 'bg-blue-500' : 'bg-gray-700'}`}
                    style={{ width: size * 3 + 'px', height: size * 3 + 'px' }}
                    title={`Størrelse ${size}px`}
                  />
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 ml-4">
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
      </div>
      
      <div className="flex-grow overflow-auto flex items-center justify-center bg-gray-900 p-2">
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full bg-white shadow-lg"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseOut={endDrawing}
          style={{ cursor: tool === 'eraser' ? 'cell' : tool === 'pencil' ? 'crosshair' : 'default' }}
        />
      </div>
    </div>
  );
}

export default DrawingEditor; 