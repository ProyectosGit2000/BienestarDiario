import React, { useState, useEffect } from 'react';
import './App.css';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';


function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('login');
  const [moodLevel, setMoodLevel] = useState(5);
  const [dailyQuote, setDailyQuote] = useState('');
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [userProgress, setUserProgress] = useState({});
  const [moodHistory, setMoodHistory] = useState([]);

  // Formularios
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ username: '', email: '', password: '' });

  // Frases motivacionales por estado de ánimo
  const motivationalQuotes = {
    1: [
      "Los días difíciles hacen que las personas fuertes sean más fuertes. 💪",
      "Esta tormenta también pasará. Eres más fuerte de lo que crees. 🌈",
      "Cada día es una nueva oportunidad para comenzar de nuevo. ✨"
    ],
    2: [
      "Es normal sentirse así a veces. Sé amable contigo mismo. 💙",
      "Los pequeños pasos también cuentan. Avanza a tu ritmo. 🚶‍♂️",
      "Mañana puede ser diferente. Descansa hoy. 🌙"
    ],
    3: [
      "Estás en camino. Cada día es un paso hacia adelante. 🌱",
      "La constancia es la clave del éxito. Sigue adelante. 🔑",
      "Pequeños progresos siguen siendo progresos. 📈"
    ],
    4: [
      "¡Vas muy bien! Mantén esa energía positiva. ⚡",
      "Tu actitud positiva es contagiosa. Sigue brillando. ✨",
      "Estás creando una vida increíble. ¡Continúa! 🌟"
    ],
    5: [
      "¡Estás radiante! Comparte esa energía con el mundo. 🌞",
      "Tu felicidad es inspiradora. ¡Sigue así! 🎉",
      "Eres imparable cuando te sientes así. ¡Aprovecha el momento! 🚀"
    ]
  };

  // Retos con pasos detallados
  const challenges = {
    physical: [
      {
        id: 1,
        name: "Rutina de Ejercicio Matutino",
        description: "Comienza tu día con energía",
        steps: [
          "Levántate 15 minutos antes de lo usual",
          "Bebe un vaso de agua",
          "Haz 10 jumping jacks",
          "Realiza 10 flexiones (o modificadas)",
          "Haz 20 sentadillas",
          "Estira por 3 minutos",
          "Respira profundamente 5 veces"
        ],
        duration: "15 minutos",
        difficulty: "Fácil"
      },
      {
        id: 2,
        name: "Caminata Mindful",
        description: "Camina con conciencia plena",
        steps: [
          "Elige una ruta familiar de 20 minutos",
          "Deja el teléfono en modo silencio",
          "Camina a paso normal los primeros 5 minutos",
          "Enfócate en tu respiración",
          "Observa 5 cosas nuevas en tu entorno",
          "Siente tus pies tocando el suelo",
          "Termina con 3 respiraciones profundas"
        ],
        duration: "20 minutos",
        difficulty: "Fácil"
      }
    ],
    mental: [
      {
        id: 3,
        name: "Meditación de Gratitud",
        description: "Cultiva la gratitud diaria",
        steps: [
          "Busca un lugar tranquilo",
          "Siéntate cómodamente",
          "Cierra los ojos",
          "Respira profundamente 3 veces",
          "Piensa en 3 cosas por las que estás agradecido",
          "Siente la gratitud en tu corazón",
          "Mantén esa sensación por 5 minutos"
        ],
        duration: "10 minutos",
        difficulty: "Fácil"
      },
      {
        id: 4,
        name: "Journaling Reflexivo",
        description: "Reflexiona sobre tu día",
        steps: [
          "Toma papel y lápiz",
          "Escribe la fecha",
          "Responde: ¿Qué me hizo sentir bien hoy?",
          "Escribe: ¿Qué desafío enfrenté?",
          "Anota: ¿Qué aprendí?",
          "Escribe: ¿Cómo me siento ahora?",
          "Termina con una afirmación positiva"
        ],
        duration: "15 minutos",
        difficulty: "Fácil"
      }
    ],
    creative: [
      {
        id: 5,
        name: "Arte Expresivo",
        description: "Expresa tus emociones a través del arte",
        steps: [
          "Reúne materiales: papel, colores, lápices",
          "Pon música relajante",
          "Cierra los ojos y piensa en cómo te sientes",
          "Elige colores que representen tu estado",
          "Dibuja sin juzgar, solo expresa",
          "No busques perfección, busca expresión",
          "Al terminar, observa tu creación con amor"
        ],
        duration: "20 minutos",
        difficulty: "Fácil"
      }
    ]
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      updateDailyQuote();
      loadUserProgress();
      loadMoodHistory();
    }
  }, [isAuthenticated, moodLevel]);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          setIsAuthenticated(true);
          setCurrentView('dashboard');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      }
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        setUser(data.user);
        setIsAuthenticated(true);
        setCurrentView('dashboard');
        setLoginForm({ username: '', password: '' });
      } else {
        alert('Error al iniciar sesión');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Error de conexión');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerForm)
      });
      
      if (response.ok) {
        alert('Cuenta creada exitosamente');
        setCurrentView('login');
        setRegisterForm({ username: '', email: '', password: '' });
      } else {
        alert('Error al crear cuenta');
      }
    } catch (error) {
      console.error('Register error:', error);
      alert('Error de conexión');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
    setCurrentView('login');
  };

  const updateDailyQuote = () => {
    const quotes = motivationalQuotes[moodLevel] || motivationalQuotes[3];
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setDailyQuote(randomQuote);
  };

  const saveMoodEntry = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/mood/save`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ mood: moodLevel, date: new Date().toISOString() })
      });
      loadMoodHistory();
    } catch (error) {
      console.error('Error saving mood:', error);
    }
  };

  const loadUserProgress = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/progress`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUserProgress(data);
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const loadMoodHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/mood/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMoodHistory(data);
      }
    } catch (error) {
      console.error('Error loading mood history:', error);
    }
  };

  const startChallenge = async (challenge) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/challenge/start`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ challengeId: challenge.id })
      });
      setSelectedChallenge(challenge);
      setCurrentView('challenge');
    } catch (error) {
      console.error('Error starting challenge:', error);
    }
  };

  const completeChallenge = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/challenge/complete`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ challengeId: selectedChallenge.id })
      });
      alert('¡Felicitaciones! Has completado el reto 🎉');
      setCurrentView('dashboard');
      setSelectedChallenge(null);
      loadUserProgress();
    } catch (error) {
      console.error('Error completing challenge:', error);
    }
  };

  const getMoodEmoji = (level) => {
    const emojis = { 1: '😢', 2: '😔', 3: '😐', 4: '😊', 5: '😄' };
    return emojis[level] || '😐';
  };

  const getMoodColor = (level) => {
    const colors = { 1: 'bg-red-500', 2: 'bg-orange-500', 3: 'bg-yellow-500', 4: 'bg-green-500', 5: 'bg-blue-500' };
    return colors[level] || 'bg-gray-500';
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-blue-500 flex items-center justify-center">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">🌟 Bienestar Diario</h1>
            <p className="text-gray-600">Tu compañero de bienestar personal</p>
          </div>

          {currentView === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Usuario</label>
                <input
                  type="text"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition duration-200"
              >
                Iniciar Sesión
              </button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setCurrentView('register')}
                  className="text-purple-600 hover:text-purple-800 font-medium"
                >
                  ¿No tienes cuenta? Regístrate
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Usuario</label>
                <input
                  type="text"
                  value={registerForm.username}
                  onChange={(e) => setRegisterForm({...registerForm, username: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
                <input
                  type="password"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition duration-200"
              >
                Crear Cuenta
              </button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setCurrentView('login')}
                  className="text-purple-600 hover:text-purple-800 font-medium"
                >
                  ¿Ya tienes cuenta? Inicia sesión
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-blue-500">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">🌟 Bienestar Diario</h1>
          <div className="flex items-center space-x-4">
            <span className="text-white">Hola, {user?.username}!</span>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition duration-200"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {currentView === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Mood Tracker */}
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">¿Cómo te sientes hoy?</h2>
              <div className="space-y-6">
                <div className="flex justify-center">
                  <div className="text-8xl">{getMoodEmoji(moodLevel)}</div>
                </div>
                <div className="space-y-4">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={moodLevel}
                    onChange={(e) => setMoodLevel(parseInt(e.target.value))}
                    className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Muy triste</span>
                    <span>Triste</span>
                    <span>Normal</span>
                    <span>Feliz</span>
                    <span>Muy feliz</span>
                  </div>
                </div>
                <button
                  onClick={saveMoodEntry}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition duration-200"
                >
                  Guardar Estado de Ánimo
                </button>
              </div>
            </div>

            {/* Daily Quote */}
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Tu Frase del Día</h2>
              <div className="text-center">
                <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-6 mb-6">
                  <p className="text-lg text-gray-700 italic">{dailyQuote}</p>
                </div>
                <button
                  onClick={updateDailyQuote}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition duration-200"
                >
                  Nueva Frase
                </button>
              </div>
            </div>

            {/* Challenges */}
            <div className="lg:col-span-2 bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Retos para Ti</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Physical Challenges */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-purple-600 text-center">💪 Físicos</h3>
                  {challenges.physical.map((challenge) => (
                    <div key={challenge.id} className="bg-purple-50 p-4 rounded-xl">
                      <h4 className="font-semibold text-gray-800">{challenge.name}</h4>
                      <p className="text-sm text-gray-600 mb-2">{challenge.description}</p>
                      <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
                        <span>⏱️ {challenge.duration}</span>
                        <span>📊 {challenge.difficulty}</span>
                      </div>
                      <button
                        onClick={() => startChallenge(challenge)}
                        className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition duration-200"
                      >
                        Comenzar Reto
                      </button>
                    </div>
                  ))}
                </div>

                {/* Mental Challenges */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-pink-600 text-center">🧠 Mentales</h3>
                  {challenges.mental.map((challenge) => (
                    <div key={challenge.id} className="bg-pink-50 p-4 rounded-xl">
                      <h4 className="font-semibold text-gray-800">{challenge.name}</h4>
                      <p className="text-sm text-gray-600 mb-2">{challenge.description}</p>
                      <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
                        <span>⏱️ {challenge.duration}</span>
                        <span>📊 {challenge.difficulty}</span>
                      </div>
                      <button
                        onClick={() => startChallenge(challenge)}
                        className="w-full bg-pink-600 text-white py-2 rounded-lg hover:bg-pink-700 transition duration-200"
                      >
                        Comenzar Reto
                      </button>
                    </div>
                  ))}
                </div>

                {/* Creative Challenges */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-blue-600 text-center">🎨 Creativos</h3>
                  {challenges.creative.map((challenge) => (
                    <div key={challenge.id} className="bg-blue-50 p-4 rounded-xl">
                      <h4 className="font-semibold text-gray-800">{challenge.name}</h4>
                      <p className="text-sm text-gray-600 mb-2">{challenge.description}</p>
                      <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
                        <span>⏱️ {challenge.duration}</span>
                        <span>📊 {challenge.difficulty}</span>
                      </div>
                      <button
                        onClick={() => startChallenge(challenge)}
                        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition duration-200"
                      >
                        Comenzar Reto
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'challenge' && selectedChallenge && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">{selectedChallenge.name}</h2>
                <p className="text-gray-600">{selectedChallenge.description}</p>
                <div className="flex justify-center items-center space-x-4 mt-4">
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                    ⏱️ {selectedChallenge.duration}
                  </span>
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                    📊 {selectedChallenge.difficulty}
                  </span>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Pasos a seguir:</h3>
                {selectedChallenge.steps.map((step, index) => (
                  <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl">
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <p className="text-gray-700 flex-1">{step}</p>
                  </div>
                ))}
              </div>

              <div className="flex space-x-4 justify-center">
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold transition duration-200"
                >
                  Volver al Inicio
                </button>
                <button
                  onClick={completeChallenge}
                  className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-700 hover:to-blue-700 transition duration-200"
                >
                  ¡Completé el Reto!
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;