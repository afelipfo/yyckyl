'use strict';

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. CONFIGURACIÓN Y ESTADO DE LA APLICACIÓN ---
    
    const AppState = {
        IDLE: 'IDLE',
        LISTENING: 'LISTENING',
        PROCESSING: 'PROCESSING',
        SPEAKING: 'SPEAKING',
        ERROR: 'ERROR'
    };

    let currentState = AppState.IDLE;

    const config = {
        lang: 'es-CO', // Lenguaje para reconocimiento y síntesis
        keywords: {
            negativo: ["cansado", "agotado", "estresado", "triste", "preocupado", "mal", "terrible", "difícil", "regular"],
            positivo: ["bien", "feliz", "genial", "increíble", "motivado", "contento", "emocionado", "excelente", "fantástico"]
        },
        responses: {
            negativo: [
                "Entiendo. Recuerda que está bien no estar bien. Tómate un respiro, lo mereces.",
                "Lamento que te sientas así. A veces, una pequeña pausa puede cambiarlo todo. Respira.",
                "Escucho lo que dices. Recuerda que eres más fuerte que tus días malos. Mañana será diferente."
            ],
            positivo: [
                "¡Fantástico! Canaliza esa energía para hacer algo que amas y te impulse aún más.",
                "Me alegra mucho escuchar eso. Aprovecha esta increíble sensación y compártela.",
                "¡Excelente! Que esa motivación sea el combustible para alcanzar tus metas de hoy."
            ],
            neutral: [
                "De acuerdo. Aquí tienes un pensamiento: la constancia es más poderosa que la intensidad.",
                "Entendido. Te comparto una idea: el mejor momento para empezar algo fue ayer, el segundo mejor es ahora.",
                "Recibido. Un pequeño consejo: enfócate en el progreso, no en la perfección."
            ]
        }
    };
    
    // --- 2. REFERENCIAS AL DOM ---
    
    const ui = {
        micButton: document.getElementById('mic-button'),
        statusText: document.getElementById('status-text'),
        userSpeech: document.getElementById('user-speech')
    };

    // --- 3. INICIALIZACIÓN DE APIS DE VOZ ---
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const synthesis = window.speechSynthesis;

    if (!SpeechRecognition || !synthesis) {
        updateUiOnError("Tu navegador no es compatible con las tecnologías de voz. Prueba con Chrome o Edge.");
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = config.lang;
    recognition.continuous = false; // Queremos que pare después de una frase
    recognition.interimResults = true; // Para feedback en tiempo real

    let spanishVoice;
    synthesis.onvoiceschanged = () => {
        const voices = synthesis.getVoices();
        spanishVoice = voices.find(v => v.lang.startsWith('es-LA')) || voices.find(v => v.lang.startsWith('es-US')) || voices.find(v => v.lang.startsWith('es-MX')) || voices.find(v => v.lang.startsWith('es-ES'));
    };

    // --- 4. MANEJO DE ESTADO Y UI ---
    
    function setState(newState) {
        currentState = newState;
        document.body.className = `state-${newState.toLowerCase()}`;
        ui.micButton.className = `mic-button ${newState.toLowerCase()}`;

        switch (newState) {
            case AppState.IDLE:
                updateStatus("Presiona el botón para comenzar");
                ui.micButton.disabled = false;
                break;
            case AppState.LISTENING:
                updateStatus("Escuchando...", "info");
                ui.micButton.disabled = false; // Permitir que el usuario detenga
                break;
            case AppState.PROCESSING:
                updateStatus("Analizando...", "info");
                ui.micButton.disabled = true;
                break;
            case AppState.SPEAKING:
                updateStatus("Respondiendo...", "info");
                ui.micButton.disabled = true;
                break;
            case AppState.ERROR:
                ui.micButton.disabled = false;
                break;
        }
    }

    function updateStatus(text, type = '') {
        ui.statusText.textContent = text;
        ui.statusText.className = `status-text ${type}`;
    }

    function updateUiOnError(errorMessage) {
        setState(AppState.ERROR);
        updateStatus(errorMessage, 'error');
    }

    // --- 5. LÓGICA DE CONVERSACIÓN (IA) ---
    
    function processVoiceInput(transcript) {
        setState(AppState.PROCESSING);
        const lowerCaseTranscript = transcript.toLowerCase();
        let mood = 'neutral';

        if (config.keywords.negativo.some(word => lowerCaseTranscript.includes(word))) {
            mood = 'negativo';
        } else if (config.keywords.positivo.some(word => lowerCaseTranscript.includes(word))) {
            mood = 'positivo';
        }

        const responses = config.responses[mood];
        const response = responses[Math.floor(Math.random() * responses.length)];
        
        speak(response);
    }

    function speak(text) {
        setState(AppState.SPEAKING);
        const utterance = new SpeechSynthesisUtterance(text);
        if (spanishVoice) {
            utterance.voice = spanishVoice;
        }
        utterance.onend = () => {
            setState(AppState.IDLE);
        };
        utterance.onerror = () => {
            updateUiOnError("Ocurrió un error al generar la respuesta de voz.");
            setState(AppState.IDLE);
        };
        synthesis.speak(utterance);
    }

    // --- 6. EVENTOS Y CONTROLADORES ---

    function handleMicClick() {
        if (currentState === AppState.LISTENING) {
            recognition.stop();
            return;
        }
        try {
            recognition.start();
        } catch (error) {
            updateUiOnError("El reconocimiento de voz ya está activo.");
        }
    }

    recognition.onstart = () => {
        setState(AppState.LISTENING);
        ui.userSpeech.textContent = ''; // Limpiar transcripción anterior
    };

    recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = 0; i < event.results.length; i++) {
            const transcriptPart = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcriptPart;
            } else {
                interimTranscript += transcriptPart;
            }
        }
        
        ui.userSpeech.textContent = interimTranscript || finalTranscript; // Muestra transcripción en tiempo real

        if (finalTranscript) {
            processVoiceInput(finalTranscript);
        }
    };
    
    recognition.onerror = (event) => {
        let errorMessage;
        switch (event.error) {
            case 'no-speech':
                errorMessage = "No se detectó voz. Intenta de nuevo.";
                break;
            case 'not-allowed':
                errorMessage = "Permiso de micrófono denegado.";
                break;
            case 'service-not-allowed':
                errorMessage = "El navegador bloqueó el servicio de voz.";
                break;
            default:
                errorMessage = `Error de reconocimiento: ${event.error}`;
        }
        updateUiOnError(errorMessage);
        setState(AppState.IDLE);
    };

    recognition.onend = () => {
        if (currentState === AppState.LISTENING) { // Si termina sin un resultado final
            setState(AppState.IDLE);
        }
    };

    // --- 7. INICIALIZACIÓN ---
    
    function init() {
        ui.micButton.addEventListener('click', handleMicClick);
        setState(AppState.IDLE);
    }
    
    init();
});