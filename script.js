document.addEventListener('DOMContentLoaded', () => {
    // Referencias a elementos del DOM
    const startButton = document.getElementById('startButton');
    const status = document.getElementById('status');
    const userText = document.getElementById('userText');
    const robotText = document.getElementById('robotText');

    // Comprobación de compatibilidad con la API de reconocimiento de voz
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        status.textContent = 'Tu navegador no soporta la API de Reconocimiento de Voz.';
        startButton.disabled = true;
        return;
    }
    const recognition = new SpeechRecognition();

    // Comprobación de compatibilidad con la API de síntesis de voz
    const synthesis = window.speechSynthesis;
    if (!synthesis) {
        status.textContent = 'Tu navegador no soporta la API de Síntesis de Voz.';
        startButton.disabled = true;
        return;
    }
    
    let spanishVoice;
    // Cargar las voces disponibles y seleccionar una en español de Latinoamérica
    synthesis.onvoiceschanged = () => {
        const voices = synthesis.getVoices();
        spanishVoice = voices.find(voice => voice.lang.startsWith('es-LA') || voice.lang.startsWith('es-US') || voice.lang.startsWith('es-MX'));
        if (!spanishVoice) {
            spanishVoice = voices.find(voice => voice.lang.startsWith('es-'));
        }
    };

    // --- Lista de Consejos ---
    const consejos = [
        "Hoy, enfócate en el progreso, no en la perfección.", "Un pequeño paso hoy es un gran salto para tu mañana.", "Agradece por tres cosas antes de dormir.",
        "Bebe un vaso de agua apenas te levantes.", "Escucha tu canción favorita para empezar el día con energía.", "Sonríe a un extraño, podrías cambiar su día.",
        "Dedica 15 minutos a aprender algo nuevo.", "La paciencia es tu mejor aliada en los días complicados.", "Organiza tu espacio de trabajo; tu mente lo agradecerá.",
        "Haz una pausa de 5 minutos por cada hora de trabajo.", "Cree en ti, incluso cuando nadie más lo haga.", "El error es una oportunidad para aprender, no un fracaso.",
        "Termina esa tarea que has estado posponiendo.", "Llama a un amigo o familiar solo para saludar.", "Celebra tus pequeñas victorias del día.",
        "Dedica tiempo a no hacer nada, es bueno para la creatividad.", "Sal a caminar y respira aire fresco.", "Escribe tus pensamientos, te ayudará a aclararlos.",
        "No te compares con los demás; tu camino es único.", "Aprende a decir 'no' cuando sea necesario.", "La mejor forma de predecir el futuro es creándolo.",
        "Come algo saludable que te guste mucho.", "Duerme lo suficiente, es la mejor inversión en tu salud.", "Si te caes, levántate con más fuerza.",
        "La amabilidad no cuesta nada y lo vale todo.", "Lee al menos una página de un buen libro.", "No dejes que el miedo decida por ti.",
        "Estira tu cuerpo por la mañana.", "Pregúntate: ¿esto importará en un año?", "Haz algo hoy que tu 'yo' del futuro agradezca.",
        "Escucha más y habla menos.", "Deja ir lo que no puedes controlar.", "La vida es simple, no la compliques.",
        "Un día a la vez.", "Sé la energía que quieres atraer.", "Elige ser optimista, se siente mejor.",
        "No busques la felicidad, créala.", "La disciplina es el puente entre tus metas y tus logros.", "Permítete descansar sin sentirte culpable.",
        "Haz una buena acción sin esperar nada a cambio.", "Ríe a carcajadas al menos una vez hoy.", "Valora el presente, es el único tiempo que tienes.",
        "Aprende de las críticas, pero no dejes que te definan.", "La actitud lo es todo, elige una buena.", "No temas pedir ayuda, es un signo de fortaleza.",
        "Mantén tus promesas, especialmente las que te haces a ti mismo.", "Desconéctate de la tecnología por una hora.", "La gratitud transforma lo que tenemos en suficiente.",
        "El sol siempre vuelve a salir.", "Confía en el proceso de tu vida.", "Haz las paces con tu pasado para que no arruine tu presente.",
        "Lo que otros piensen de ti no es tu problema.", "El tiempo cura casi todo, dale tiempo al tiempo.", "Nadie está a cargo de tu felicidad, excepto tú.",
        "Deja de pensar tanto, está bien no saber todas las respuestas.", "La única competencia real eres tú mismo.", "Invertir en ti mismo es la mejor inversión que harás.",
        "Sé flexible con tus metas, pero firme con tus valores.", "Ordena tu clóset, ordena tu mente.", "Perdona a alguien hoy, incluso si esa persona eres tú.",
        "Prueba una ruta diferente para ir al trabajo o a casa.", "Mira un documental sobre un tema que desconozcas.", "Hidrátate bien durante todo el día.",
        "Si algo no te gusta, cámbialo. Si no puedes cambiarlo, cambia tu actitud.", "El esfuerzo de hoy es la recompensa de mañana.", "No subestimes el poder de un buen día de descanso.",
        "Trata a los demás como te gustaría que te trataran.", "Baila como si nadie te estuviera viendo.", "Cuestiona tus propias creencias de vez en cuando.",
        "Sé curioso, haz preguntas.", "Disfruta del silencio.", "Prioriza tus tareas del día: haz primero lo más importante.",
        "No te tomes todo tan a pecho.", "Un problema compartido es medio problema resuelto.", "Sé amable contigo mismo en tus días malos.",
        "Planifica tu día la noche anterior.", "El cambio es la única constante, abrázalo.", "No esperes el momento perfecto, toma el momento y hazlo perfecto.",
        "La persistencia vence al talento.", "Haz algo que te dé un poco de miedo.", "No te preocupes por el fracaso, preocúpate por las oportunidades que pierdes al no intentarlo.",
        "Aprecia la belleza en las cosas pequeñas.", "Habla con la verdad, siempre.", "Rodéate de gente que te inspire a ser mejor.",
        "Si tienes un sueño, tienes que protegerlo.", "La acción es la clave fundamental de todo éxito.", "Tu mente es un jardín, cuida lo que plantas en ella.",
        "La simplicidad es la máxima sofisticación.", "Escribe tres cosas por las que te sientes orgulloso.", "Respira profundo. Inhala paz, exhala caos.",
        "Sé un eterno aprendiz.", "No guardes rencor, libera esa carga.", "Define cómo se ve el éxito para ti.",
        "Gasta dinero en experiencias, no solo en cosas.", "Ayuda a alguien sin que te lo pida.", "Sé humilde en tus victorias y resiliente en tus derrotas.",
        "La consistencia es más importante que la intensidad.", "Confía en tu intuición, rara vez se equivoca.", "Termina tu día con un pensamiento positivo.",
        "Recuerda que eres más fuerte de lo que crees."
    ];
    
    const diasDeLaSemana = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
    let conversationState = 'initial'; // 'initial' -> 'waiting_for_advice'

    // --- Configuración del Reconocimiento de Voz ---
    recognition.lang = 'es-CO'; // Español de Colombia para un toque más "paisa"
    recognition.continuous = false; // Solo procesa un resultado
    recognition.interimResults = false; // No muestra resultados parciales

    // --- Función para que el Robot Hable ---
    function speak(text) {
        // Detener cualquier habla anterior para evitar solapamientos
        synthesis.cancel(); 
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = spanishVoice ? spanishVoice.lang : 'es-ES';
        if (spanishVoice) {
            utterance.voice = spanishVoice;
        }
        utterance.pitch = 1;
        utterance.rate = 1;
        robotText.textContent = text;
        synthesis.speak(utterance);
    }

    // --- Lógica de la Conversación ---
    function handleVoice(transcript) {
        userText.textContent = transcript;
        const lowerCaseTranscript = transcript.toLowerCase();

        if (conversationState === 'initial' && lowerCaseTranscript.includes('hola robot')) {
            const respuesta = 'Hola, qué tal, cómo estás el día de hoy?';
            speak(respuesta);
            conversationState = 'waiting_for_advice';
        } else if (conversationState === 'waiting_for_advice' && (lowerCaseTranscript.includes('consejo') || lowerCaseTranscript.includes('dame'))) {
            let diaEncontrado = null;
            for (const dia of diasDeLaSemana) {
                if (lowerCaseTranscript.includes(dia)) {
                    diaEncontrado = dia;
                    break;
                }
            }
            
            if (diaEncontrado) {
                const consejoAleatorio = consejos[Math.floor(Math.random() * consejos.length)];
                const respuesta = `De una, vamos pa' esa! Para tu ${diaEncontrado}: ${consejoAleatorio}`;
                speak(respuesta);
            } else {
                speak('Claro, pero no entendí para qué día. Por favor, menciona un día de la semana.');
            }
            // Volvemos al estado inicial para poder saludar de nuevo
            conversationState = 'initial'; 
        } else {
            // Si no entiende, no dice nada para no ser intrusivo.
            // Opcional: podrías agregar una respuesta como "No te entendí".
        }
    }

    // --- Event Listeners ---
    startButton.addEventListener('click', () => {
        status.textContent = 'Escuchando...';
        startButton.classList.add('listening');
        recognition.start();
    });

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        handleVoice(transcript);
    };

    recognition.onerror = (event) => {
        status.textContent = `Error en el reconocimiento: ${event.error}`;
    };
    
    recognition.onend = () => {
        status.textContent = 'Inactivo';
        startButton.classList.remove('listening');
    };
});