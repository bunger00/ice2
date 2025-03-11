import React, { useRef, useState, useEffect } from 'react';
import { Pencil, Eraser, Save, X, Square, Circle, ArrowUp } from 'lucide-react';

const DrawingEditor = ({ imageData, onSave, onClose, initialStrokes = [] }) => {
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

  // Predefinerte farger
  const colors = [
    '#FF0000', // Rød
    '#00FF00', // Grønn
    '#0000FF', // Blå
    '#FFFF00', // Gul
    '#FF00FF', // Magenta
    '#000000'  // Sort
  ];

  // Predefinerte penselstørrelser
  const penSizes = [1, 3, 6, 10]; // 4 forskjellige tykkelser

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
      if (!stroke.points || stroke.points.length < 1) return;
      
      ctx.save(); // Lagre nåværende context-tilstand
      
      // Sett felles egenskaper
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      if (stroke.tool === 'pencil' || stroke.tool === 'brush') {
        // Tegn frihåndsstrek
        if (stroke.points.length < 2) return;
        
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        
        ctx.stroke();
      } else if (stroke.tool === 'rectangle' && stroke.points.length >= 2) {
        // Tegn rektangel
        const startPoint = stroke.points[0];
        const endPoint = stroke.points[stroke.points.length - 1];
        const width = endPoint.x - startPoint.x;
        const height = endPoint.y - startPoint.y;
        
        ctx.beginPath();
        ctx.rect(startPoint.x, startPoint.y, width, height);
        ctx.stroke();
      } else if (stroke.tool === 'circle' && stroke.points.length >= 2) {
        // Tegn sirkel
        const startPoint = stroke.points[0];
        const endPoint = stroke.points[stroke.points.length - 1];
        const dx = endPoint.x - startPoint.x;
        const dy = endPoint.y - startPoint.y;
        const radius = Math.sqrt(dx * dx + dy * dy);
        
        ctx.beginPath();
        ctx.arc(startPoint.x, startPoint.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (stroke.tool === 'arrow' && stroke.points.length >= 2) {
        // Tegn pil
        const startPoint = stroke.points[0];
        const endPoint = stroke.points[stroke.points.length - 1];
        
        // Tegn linje
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(endPoint.x, endPoint.y);
        ctx.stroke();
        
        // Tegn pilspiss
        const angle = Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x);
        const headLength = 15; // Lengde på pilspissen
        
        ctx.beginPath();
        ctx.moveTo(endPoint.x, endPoint.y);
        ctx.lineTo(
          endPoint.x - headLength * Math.cos(angle - Math.PI / 6),
          endPoint.y - headLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(endPoint.x, endPoint.y);
        ctx.lineTo(
          endPoint.x - headLength * Math.cos(angle + Math.PI / 6),
          endPoint.y - headLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
      }
      
      ctx.restore(); // Gjenopprett context-tilstand
    });
  };

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
      
      if (tool === 'rectangle') {
        // Rektangel preview
        const width = x - startPoint.x;
        const height = y - startPoint.y;
        
        context.beginPath();
        context.rect(startPoint.x, startPoint.y, width, height);
        context.stroke();
      } else if (tool === 'circle') {
        // Sirkel preview
        const dx = x - startPoint.x;
        const dy = y - startPoint.y;
        const radius = Math.sqrt(dx * dx + dy * dy);
        
        context.beginPath();
        context.arc(startPoint.x, startPoint.y, radius, 0, 2 * Math.PI);
        context.stroke();
      } else if (tool === 'arrow') {
        // Pil preview
        context.beginPath();
        context.moveTo(startPoint.x, startPoint.y);
        context.lineTo(x, y);
        context.stroke();
        
        // Tegn pilspiss
        const angle = Math.atan2(y - startPoint.y, x - startPoint.x);
        const headLength = 15;
        
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(
          x - headLength * Math.cos(angle - Math.PI / 6),
          y - headLength * Math.sin(angle - Math.PI / 6)
        );
        context.moveTo(x, y);
        context.lineTo(
          x - headLength * Math.cos(angle + Math.PI / 6),
          y - headLength * Math.sin(angle + Math.PI / 6)
        );
        context.stroke();
      }
      
      context.restore();
    }
  };

  // Eraser funksjonalitet
  const eraseStrokes = (x, y, radius) => {
    // Finn og fjern streker som er i nærheten av (x, y)
    setStrokes(prevStrokes => {
      // Filtrerer ut streker eller deler av streker innenfor viskeradiusen
      const updatedStrokes = prevStrokes.map(stroke => {
        // Sjekk om noen punkter i streken skal viskes ut
        const filteredPoints = stroke.points.filter(point => {
          const distance = Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2));
          return distance > radius;
        });
        
        // Hvis streken fortsatt har nok punkter, behold den
        if (filteredPoints.length > 1 && filteredPoints.length === stroke.points.length) {
          return stroke;
        } else if (filteredPoints.length > 1) {
          // Hvis noen punkter ble visket ut, men ikke alle, oppdater streken
          return { ...stroke, points: filteredPoints };
        } else {
          // Hvis streken nå er for kort eller tom, fjern den helt
          return null;
        }
      }).filter(stroke => stroke !== null);
      
      return updatedStrokes;
    });
    
    // Redraw canvas med oppdaterte streker
    redrawCanvas();
  };

  // Redraw canvas med oppdaterte streker
  const redrawCanvas = () => {
    if (!context || !image) return;
    
    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    context.drawImage(image, 0, 0, canvasRef.current.width, canvasRef.current.height);
    
    drawStrokes(strokes, context);
  };

  // Avslutt tegning
  const endDrawing = () => {
    if (!isDrawing) return;
    
    setIsDrawing(false);
    
    if (tool === 'pencil' || tool === 'brush') {
      context.closePath();
    }
    
    if (currentStroke.length > 1 || (tool !== 'pencil' && tool !== 'brush' && currentStroke.length > 0)) {
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
        <div className="flex items-center space-x-4 flex-wrap">
          {/* Tegneverktøy */}
          <div className="flex items-center space-x-2">
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
          <div className="flex items-center space-x-2 flex-wrap">
            <span className="text-sm">Farge:</span>
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
          <div className="flex items-center space-x-2">
            <span className="text-sm">Størrelse:</span>
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
          style={{ cursor: tool === 'eraser' ? 'cell' : tool === 'pencil' ? 'crosshair' : 'default' }}
        />
      </div>
    </div>
  );
};

export default DrawingEditor; 