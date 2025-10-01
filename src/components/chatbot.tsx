import React, { useState, useEffect, useRef } from 'react';
import './chatbot.css';

interface Message {
  text: string;
  isUser: boolean;
}

interface AutoResponse {
  keywords: string[];
  response: string;
}

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Respuestas automáticas predefinidas
  const autoResponses: AutoResponse[] = [
    {
      keywords: ['servicio', 'servicios', 'ofrecen', 'tienen'],
      response: `Nuestros servicios principales incluyen: 
- Limpieza dental profesional
- Blanqueamiento dental
- Ortodoncia (brackets tradicionales e invisibles)
- Implantes dentales
- Odontopediatría
- Endodoncia (tratamiento de conducto)
- Estética dental (carillas, coronas)
- Periodoncia (tratamiento de encías)
- Urgencias dentales
¿Te gustaría saber más sobre algún servicio o su costo en particular?`
    },
    {
      keywords: ['precio', 'precios', 'costo', 'costos', 'valor', 'cuanto', 'cuánto'],
      response: `Aquí están nuestros precios referenciales en bolivianos:
- Consulta y diagnóstico: 100 Bs
- Limpieza dental profesional: 250 Bs
- Blanqueamiento dental: desde 500 Bs
- Ortodoncia: desde 2000 Bs
- Implantes dentales: desde 3000 Bs por pieza
- Tratamiento de conducto: desde 800 Bs
- Carillas dentales: desde 700 Bs por pieza
- Coronas dentales: desde 1000 Bs
- Extracciones simples: desde 200 Bs
Los precios pueden variar según el caso específico y el plan de tratamiento.`
    },
    {
      keywords: ['horario', 'atienden', 'abierto', 'hora'],
      response: 'Nuestro horario de atención es de lunes a viernes de 8:00 AM a 8:00 PM y sábados de 9:00 AM a 2:00 PM. Para urgencias dentales contamos con servicio especial.'
    },
    {
      keywords: ['emergencia', 'urgencia', 'urgente'],
      response: 'Atendemos urgencias dentales como dolor intenso, inflamación, traumatismos o piezas dentales rotas. En caso de urgencia fuera del horario regular, por favor llamar al número de guardia: +591 12345679.'
    },
    {
      keywords: ['ubicación', 'dirección', 'donde', 'dónde', 'llegar'],
      response: 'Estamos ubicados en la Av. Santa Cruz esquina y Calle Tomás Frías. Edificio Continental: Planta Baja, Cochabamba, Bolivia. Puedes encontrarnos fácilmente en Google Maps como "Clínica Odontológica Unifranz".'
    },
    {
      keywords: ['tratamiento', 'tratamientos', 'procedimiento'],
      response: 'Ofrecemos diversos tratamientos dentales como limpiezas, blanqueamientos, ortodoncia, implantes, endodoncia y estética dental. Cada tratamiento es personalizado según las necesidades del paciente. ¿Te gustaría información sobre algún tratamiento específico?'
    },
    {
      keywords: ['niños', 'niño', 'niña', 'infantil', 'pediatría'],
      response: 'Nuestra área de Odontopediatría está especialmente diseñada para atender a los más pequeños en un ambiente amigable y seguro. Contamos con especialistas en odontología infantil que harán que la experiencia sea positiva para tus hijos.'
    },
    {
      keywords: ['dolor', 'duele', 'molestia'],
      response: 'Si estás experimentando dolor dental, te recomendamos agendar una cita urgente. Mientras tanto, puedes tomar un analgésico de venta libre. Recuerda que el dolor dental suele indicar un problema que requiere atención profesional.'
    },
    {
      keywords: ['blanqueamiento', 'blanquear', 'dientes blancos'],
      response: 'Nuestro tratamiento de blanqueamiento dental profesional utiliza tecnología de última generación para aclarar el tono de tus dientes de forma segura. El procedimiento toma aproximadamente una hora y los resultados son visibles inmediatamente. Ofrecemos también kits para mantenimiento en casa.'
    },
    {
      keywords: ['brackets', 'ortodoncia', 'alinear', 'invisalign'],
      response: 'Ofrecemos diferentes opciones de ortodoncia: brackets metálicos tradicionales, brackets estéticos (transparentes o de cerámica) y alineadores invisibles. En tu primera consulta, nuestros especialistas evaluarán cuál es la mejor opción para tu caso particular.'
    },
    {
      keywords: ['implante', 'implantes', 'diente perdido', 'dientes perdidos'],
      response: 'Los implantes dentales son la solución más avanzada para reemplazar dientes perdidos. Consisten en un tornillo de titanio que se integra al hueso y una corona que se coloca sobre él. El resultado es natural tanto en apariencia como en funcionalidad. Realizamos un estudio completo previo para determinar si eres candidato.'
    }
  ];

  // Función para verificar respuestas automáticas
  const checkAutoResponse = (text: string): string | null => {
    const lowercaseText = text.toLowerCase();
    for (const autoResponse of autoResponses) {
      if (autoResponse.keywords.some(keyword => lowercaseText.includes(keyword))) {
        return autoResponse.response;
      }
    }
    return null;
  };

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          text: '¡Hola! Soy el asistente virtual de la Clínica Odontológica Unifranz. Puedo ayudarte con información sobre nuestros tratamientos dentales, precios, horarios y más. ¿En qué puedo ayudarte?',
          isUser: false,
        },
      ]);
    }
    scrollToBottom();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (inputText.trim() === '' || isLoading) return;

    const userMessage: Message = {
      text: inputText,
      isUser: true,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // Verificar si hay una respuesta automática
    const autoResponse = checkAutoResponse(inputText);

    if (autoResponse) {
      // Si hay una respuesta automática, usarla
      setTimeout(() => {
        const botMessage: Message = {
          text: autoResponse,
          isUser: false,
        };
        setMessages((prev) => [...prev, botMessage]);
        setIsLoading(false);
      }, 1000); // Pequeño delay para simular procesamiento
    } else {
      // Si no hay respuesta automática, usar Ollama
      try {
        const response = await fetch('http://localhost:3000/ollama-prompt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt: inputText }),
        });

        if (!response.ok) {
          throw new Error('Error en la respuesta del servidor');
        }

        const data = await response.json();

        const botMessage: Message = {
          text: data.response || 'Lo siento, no pude procesar tu solicitud en este momento.',
          isUser: false,
        };

        setMessages((prev) => [...prev, botMessage]);
      } catch (error) {
        console.error('Error:', error);
        const errorMessage: Message = {
          text: 'Lo siento, hubo un problema al procesar tu mensaje. Por favor, intenta de nuevo más tarde.',
          isUser: false,
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    }
  };
// Justo antes del return (
const toggleChat = () => {
  setIsOpen(!isOpen);
};
  // ... resto del código del componente se mantiene igual ...
  return (
    <div className="chatbot-container">
      <button 
        className="chat-toggle" 
        onClick={toggleChat}
        aria-label={isOpen ? 'Cerrar chat' : 'Abrir chat'}
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <h3>Chat con Clínica Odontológica Unifranz</h3>
          </div>

          <div className="messages-container">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`message ${message.isUser ? 'user-message' : 'bot-message'}`}
              >
                <span className="message-icon">
                  {message.isUser ? '👤' : '🦷'}
                </span>
                <div className="message-text">{message.text}</div>
              </div>
            ))}
            {isLoading && (
              <div className="message bot-message loading">
                <span className="message-icon">🦷</span>
                <div className="message-text">
                  <span className="typing-indicator">Escribiendo</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="input-container">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              placeholder="Pregunta sobre servicios, precios..."
              disabled={isLoading}
              rows={1}
              className="chat-input"
            />
            <button 
              onClick={handleSendMessage} 
              disabled={isLoading || inputText.trim() === ''}
              className="send-button"
            >
              {isLoading ? '...' : '📤'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;