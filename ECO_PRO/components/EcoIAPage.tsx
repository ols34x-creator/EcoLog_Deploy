
import React, { useState, useEffect } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import { TabId } from '../types';

// Browser compatibility check
// @ts-ignore
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

if (recognition) {
  recognition.continuous = false;
  recognition.lang = 'pt-BR';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
}

// FIX: Changed the value type to `TabId | string` to accommodate special commands that are not direct tab navigations.
const commandMap: { [key: string]: TabId | string } = {
    'visão geral': 'reports',
    'relatórios': 'reports',
    'transações': 'transactions',
    'operacional': 'operacional',
    'demandas': 'briefing',
    'painel de demandas': 'briefing',
    'frota': 'fleet-control',
    'controle de frota': 'fleet-control',
    'orçamento': 'freight-quotation',
    'orçamento de transporte': 'freight-quotation',
    'adicionar': 'add-record',
    'recibos': 'receipts',
    'histórico': 'history',
    'usuários': 'user-management',
    'gerenciamento de usuários': 'user-management',
    'abertura': 'abertura'
};

const EcoIAPage: React.FC = () => {
    const { setActiveTab } = useAppStore();
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [feedback, setFeedback] = useState('Clique no microfone e diga para onde quer ir. Ex: "Ir para a frota".');
    const [isSupported, setIsSupported] = useState(true);

    useEffect(() => {
        if (!recognition) {
            setIsSupported(false);
            setFeedback('Reconhecimento de voz não é suportado neste navegador. Tente usar o Google Chrome.');
            return;
        }

        // FIX: The SpeechRecognitionEvent type is not always available in standard TS DOM libs. Using 'any' for broader compatibility.
        const handleResult = (event: any) => {
            const command = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
            setTranscript(`Você disse: "${command}"`);
            
            const foundKey = Object.keys(commandMap).find(key => command.includes(key));
            
            if (foundKey) {
                const destination = commandMap[foundKey];
                // FIX: Handle the 'abertura' command as a special case to return to the landing page by reloading.
                if (destination === 'abertura') {
                    setFeedback(`Entendido! Voltando para a página de abertura...`);
                    setTimeout(() => window.location.reload(), 800);
                } else {
                    setFeedback(`Entendido! Navegando para ${foundKey}...`);
                    setTimeout(() => setActiveTab(destination as TabId), 800);
                }
            } else {
                setFeedback(`Comando "${command}" não reconhecido. Tente novamente.`);
            }
            setIsListening(false);
        };

        // FIX: The SpeechRecognitionErrorEvent type is not always available. Using 'any' for broader compatibility.
        const handleError = (event: any) => {
            if (event.error === 'no-speech' || event.error === 'audio-capture') {
                setFeedback('Não ouvi nada. Tente falar mais perto do microfone.');
            } else {
                setFeedback(`Erro: ${event.error}`);
            }
            setIsListening(false);
        };
        
        recognition.addEventListener('result', handleResult);
        recognition.addEventListener('error', handleError);
        recognition.addEventListener('end', () => setIsListening(false));

        return () => {
            recognition.removeEventListener('result', handleResult);
            recognition.removeEventListener('error', handleError);
            recognition.removeEventListener('end', () => setIsListening(false));
        };

    }, [setActiveTab]);

    const toggleListening = () => {
        if (!isSupported || !recognition) return;

        if (isListening) {
            recognition.stop();
            setIsListening(false); // Manually set state in case 'end' event doesn't fire immediately
        } else {
            // Speak the greeting
            try {
                const utterance = new SpeechSynthesisUtterance("Fala comigo, irmão");
                utterance.lang = 'pt-BR';
                window.speechSynthesis.speak(utterance);
            } catch (error) {
                console.error("Speech synthesis failed:", error);
            }

            setTranscript('');
            setFeedback('Ouvindo...');
            recognition.start();
            setIsListening(true);
        }
    };

    return (
        <div className="bg-bg-card rounded-lg p-6 shadow-lg text-center flex flex-col items-center justify-center h-[60vh]">
            <h2 className="text-2xl font-bold text-light mb-4">
                <i className="fas fa-microphone-alt mr-3 text-secondary"></i>
                Navegação por Voz
            </h2>
            <p className="text-gray-text mb-8 max-w-md">{feedback}</p>

            <div className="relative">
                 {isListening && (
                    <span className="absolute inset-0 rounded-full bg-secondary opacity-75 animate-ping"></span>
                )}
                <button
                    onClick={toggleListening}
                    disabled={!isSupported}
                    className={`relative w-40 h-40 rounded-full flex items-center justify-center transition-all duration-300 text-white text-6xl shadow-lg hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-bg-card
                        ${isListening ? 'bg-red-500' : 'bg-secondary hover:bg-primary'}
                        ${!isSupported && 'bg-gray-600 cursor-not-allowed'}`}
                    aria-label={isListening ? 'Parar de ouvir' : 'Começar a ouvir'}
                >
                    <i className="fas fa-microphone-alt"></i>
                </button>
            </div>
            
            {transcript && (
                <p className="mt-8 text-light font-mono bg-bg-main p-3 rounded-md">{transcript}</p>
            )}
        </div>
    );
};

export default EcoIAPage;