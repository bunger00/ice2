import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Pencil } from 'lucide-react';

function DrawingEditor({ imageData, onSave, onClose, initialStrokes = [] }) {
  const canvasRef = useRef(null);
  const [context, setContext] = useState(null);
  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState('#FF0000'); // Rød som standard
  const [strokeWidth, setStrokeWidth] = useState(5);
  const [originalImage, setOriginalImage] = useState(null);
  const [strokes, setStrokes] = useState(initialStrokes);
  const [currentStroke, setCurrentStroke] = useState([]);
  const [tool, setTool] = useState('pencil'); // 'pencil' eller 'eraser'

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

  const startDrawing = (e) => {
    if (!context) return;
    
    setDrawing(true);
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvasRef.current.width / rect.width);
    const y = (e.clientY - rect.top) * (canvasRef.current.height / rect.height);
    
    setCurrentStroke([{ x, y }]);
    
    if (tool === 'pencil') {
      // Start nytt strøk
      context.beginPath();
      context.strokeStyle = color;
      context.lineWidth = strokeWidth;
      context.lineJoin = 'round';
      context.lineCap = 'round';
      context.moveTo(x, y);
    }
  };

  const draw = (e) => {
    if (!drawing || !context) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvasRef.current.width / rect.width);
    const y = (e.clientY - rect.top) * (canvasRef.current.height / rect.height);
    
    // Legg til punkt i nåværende strøk
    setCurrentStroke(prev => [...prev, { x, y }]);
    
    if (tool === 'pencil') {
      // Tegn linje til nytt punkt
      context.lineTo(x, y);
      context.stroke();
    } else if (tool === 'eraser') {
      // For viskelær, finn og fjern streker i nærheten
      const eraserRadius = strokeWidth * 2;
      eraseStrokes(x, y, eraserRadius);
    }
  };

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

  const redrawCanvas = () => {
    if (!context || !originalImage) return;
    
    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    context.drawImage(originalImage, 0, 0);
    
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
  };

  const endDrawing = () => {
    if (!drawing) return;
    
    setDrawing(false);
    
    if (tool === 'pencil') {
      context.closePath();
      
      // Lagre strøket
      if (currentStroke.length > 0) {
        setStrokes(prev => [...prev, { 
          points: currentStroke, 
          color: color,
          width: strokeWidth
        }]);
      }
    }
    
    setCurrentStroke([]);
    
    // Kall saveDrawing automatisk
    saveDrawing();
  };

  const saveDrawing = () => {
    if (!canvasRef.current) return;
    
    // Lagre bildet med streker
    const dataURL = canvasRef.current.toDataURL('image/png');
    
    // Send både bildet med streker og strøkene separat
    onSave(dataURL, strokes);
  };

  const handleToolChange = (newTool) => {
    setTool(newTool);
  };

  const handleClose = () => {
    // Sørg for at alt er lagret før lukking
    saveDrawing();
    onClose();
  };

  return (
    <div className="drawing-editor">
      <div className="drawing-toolbar" style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <div className="tool-selector" style={{ display: 'flex', gap: '5px' }}>
          <button
            onClick={() => handleToolChange('pencil')}
            style={{
              padding: '5px',
              backgroundColor: tool === 'pencil' ? '#e0e0e0' : 'transparent',
              border: '1px solid #ccc',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Blyant"
          >
            <Pencil size={20} />
          </button>
          
          <button
            onClick={() => handleToolChange('eraser')}
            style={{
              padding: '5px',
              backgroundColor: tool === 'eraser' ? '#e0e0e0' : 'transparent',
              border: '1px solid #ccc',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Viskelær"
          >
            <Eraser size={20} />
          </button>
        </div>
        
        <div className="color-selector" style={{ display: 'flex', gap: '5px' }}>
          {colors.map((c, i) => (
            <button
              key={i}
              onClick={() => setColor(c)}
              style={{
                width: '25px',
                height: '25px',
                backgroundColor: c,
                border: c === color ? '2px solid white' : '1px solid #ccc',
                borderRadius: '50%',
                cursor: 'pointer',
                boxShadow: c === color ? '0 0 0 2px #000' : 'none'
              }}
              title={`Farge ${i+1}`}
            />
          ))}
        </div>
        
        <div className="stroke-width-selector" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          {penSizes.map((size, i) => (
            <button
              key={i}
              onClick={() => setStrokeWidth(size)}
              style={{
                width: size * 3 + 'px',
                height: size * 3 + 'px',
                backgroundColor: strokeWidth === size ? color : '#000',
                border: strokeWidth === size ? `2px solid white` : '1px solid #ccc',
                borderRadius: '50%',
                cursor: 'pointer',
                boxShadow: strokeWidth === size ? '0 0 0 2px #000' : 'none'
              }}
              title={`Størrelse ${size}px`}
            />
          ))}
        </div>
        
        <button 
          onClick={handleClose}
          style={{ 
            padding: '5px 10px', 
            backgroundColor: '#f0f0f0',
            border: '1px solid #ccc',
            borderRadius: '4px',
            marginLeft: 'auto',
            cursor: 'pointer'
          }}
        >
          Lukk
        </button>
      </div>
      
      <div style={{ position: 'relative' }}>
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          style={{ 
            maxWidth: '100%', 
            maxHeight: '80vh',
            boxShadow: '0 0 10px rgba(0,0,0,0.2)'
          }}
        />
      </div>
    </div>
  );
}

export default DrawingEditor; 