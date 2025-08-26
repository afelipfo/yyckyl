document.addEventListener('DOMContentLoaded', () => {
    // Referencias a elementos del DOM
    const startButton = document.getElementById('startButton');
    const status = document.getElementById('status');
    const userText = document.getElementById('userText');
    const robotText = document.getElementById('robotText');

    // Comprobación de APIs del navegador
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const synthesis = window.speechSynthesis;
    if (!SpeechRecognition || !synthesis) {
        status.textContent = 'Tu navegador no soporta las APIs de voz necesarias.';
        startButton.disabled = true;
        return;
    }
    const recognition = new SpeechRecognition();
    
    // --- SECCIÓN DE INTELIGENCIA: PALABRAS CLAVE Y CONSEJOS TEMÁTICOS ---

    // 1. Palabras clave para detectar el estado de ánimo
    const keywords = {
        negativo: ["cansado", "agotado", "estresado", "triste", "preocupado", "mal", "terrible", "difícil", "regular"],
        positivo: ["bien", "feliz", "genial", "increíble", "motivado", "contento", "emocionado", "excelente", "fantástico"]
    };

    // 2. Consejos organizados por estado de ánimo
    const consejos = {
        negativo: [ // Consejos para animar o calmar
            "Respira profundo. A veces, una pausa es todo lo que necesitas.",
            "Recuerda que todos los días malos terminan. Mañana será una nueva oportunidad.",
            "Sé amable contigo mismo. Mereces el mismo cuidado que le darías a un amigo.",
            "Permítete descansar. No tienes que ser productivo todo el tiempo.",
            "El sol siempre vuelve a salir, incluso después de la tormenta más fuerte.",
            "Escucha una canción que te guste, la música tiene el poder de sanar."
        ],
        positivo: [ // Consejos para mantener o potenciar la energía
            "¡Excelente! Usa esa energía para dar el primer paso hacia una meta que tengas.",
            "Aprovecha este momento para agradecer por tres cosas que te hacen sentir así.",
            "Tu buena actitud es contagiosa. Compártela con alguien hoy.",
            "Canaliza esa motivación para organizar tu semana y planificar algo emocionante.",
            "Celebra esta sensación. Reconoce tu propia capacidad para crear días buenos."
        ],
        neutral: [ // Consejos generales si no se detecta un ánimo específico
            "Un pequeño paso hoy es un gran salto para tu mañana.",
            "Dedica 15 minutos a aprender algo nuevo.",
            "La disciplina es el puente entre tus metas y tus logros.",
            "Haz algo hoy que tu 'yo' del futuro agradezca.",
            "No te compares con los demás; tu camino es único.",
            "La gratitud transforma lo que tenemos en suficiente."
        ]
    };

    let interactionStarted = false;
    let spanishVoice;

    synthesis.onvoiceschanged = () => {
        const voices = synthesis.getVoices();
        spanishVoice = voices.find(v => v.lang.startsWith('es-LA')) || voices.find(v => v.lang.startsWith('es-US')) || voices.find(v => v.lang.startsWith('es-MX')) || voices.find(v => v.lang.startsWith('es-'));
    };

    // --- Configuración del Reconocimiento de Voz ---
    recognition.lang = 'es-CO';
    recognition.continuous = false;
    recognition.interimResults = false;

    // --- Función para que el Robot Hable ---
    function speak(text, onEndCallback) {
        synthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        if (spanishVoice) {
            utterance.voice = spanishVoice;
        }
        robotText.textContent = text;
        utterance.onend = () => {
            if (onEndCallback) onEndCallback();
        };
        synthesis.speak(utterance);
    }

    // --- Lógica Principal de la Conversación ---
    function handleVoice(transcript) {
        userText.textContent = transcript;
        const lowerCaseTranscript = transcript.toLowerCase();
        let mood = 'neutral'; // Por defecto, el ánimo es neutral

        // Detectar estado de ánimo
        if (keywords.negativo.some(word => lowerCaseTranscript.includes(word))) {
            mood = 'negativo';
        } else if (keywords.positivo.some(word => lowerCaseTranscript.includes(word))) {
            mood = 'positivo';
        }

        // Seleccionar un consejo basado en el ánimo detectado
        const relevantAdviceList = consejos[mood];
        const consejoAleatorio = relevantAdviceList[Math.floor(Math.random() * relevantAdviceList.length)];
        
        let responseIntro = "Entiendo. Aquí tienes un pensamiento para hoy: ";
        if (mood === 'positivo') {
            responseIntro = "¡Me alegra escuchar eso! Para mantener esa energía: ";
        } else if (mood === 'negativo') {
            responseIntro = "Lamento que te sientas así. Quizás esto te ayude: ";
        }
        
        speak(responseIntro + consejoAleatorio);
    }
    
    // --- Iniciar la Interacción con el Botón ---
    startButton.addEventListener('click', () => {
        const startRecognition = () => {
            status.textContent = 'Escuchando...';
            startButton.classList.add('listening');
            try {
                recognition.start();
            } catch (e) {
                console.error("Error al iniciar el reconocimiento:", e);
                status.textContent = 'Error al iniciar';
            }
        };

        if (!interactionStarted) {
            const initialGreeting = "Hola, soy SIF-GPT. ¿Qué tal te sientes el día de hoy?";
            speak(initialGreeting, startRecognition); // Saluda y luego escucha
            interactionStarted = true;
        } else {
            speak("Claro, dime cómo estás.", startRecognition); // En interacciones posteriores
        }
    });

    // --- Eventos del Reconocimiento ---
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        handleVoice(transcript);
    };

    recognition.onerror = (event) => {
        status.textContent = `Error: ${event.error}`;
        startButton.classList.remove('listening');
    };
    
    recognition.onend = () => {
        status.textContent = 'Inactivo';
        startButton.classList.remove('listening');
    };
});