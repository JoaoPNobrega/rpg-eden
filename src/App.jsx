import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Hammer, Pickaxe, Sword, Shield, Scroll, Leaf, Coins, Utensils, Skull, Crosshair, Users, Sparkles, Ghost, Feather, Save, Trash2, AlertTriangle, User, ExternalLink, Gamepad2, Copy, Info, Wand2 } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';

// --- CONFIGURAÇÃO FIREBASE (MANTIDA PARA FUNCIONAR NO SEU PC) ---
// Preencha com os dados do seu projeto do Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyAhiGC866lmUkXph0w949gfyoTpyYRI96Q",
  authDomain: "rpgmine-d5208.firebaseapp.com",
  projectId: "rpgmine-d5208",
  storageBucket: "rpgmine-d5208.firebasestorage.app",
  messagingSenderId: "407208669122",
  appId: "1:407208669122:web:47eff08a3c2d10aa44f05b"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'app-local-teste'; 
// Mock para evitar erro se não tiver token
const __initial_auth_token = null; 

// --- UTILITÁRIO DE IMAGENS (LOCAL ASSETS) ---
const getAssetPath = (title) => {
  return `assets/${title.toLowerCase()}.png`;
};

const getOriginAsset = (title) => `assets/${title.toLowerCase()}.png`;
const getClassAsset = (title) => {
  const fileName = title.split(' ')[0].toLowerCase();
  return `assets/classes/${fileName}.png`;
};

// --- DADOS FIXOS (CLASSES E ORIGENS) ---
const CLASSES_DATA = [
  // COMBATE & FURTIVIDADE
  { category: "Combate & Furtividade", title: "Warrior (Guerreiro)", desc: "Combatentes movidos pela honra, eles confiam na espada e no escudo.", extra: "Habilidade: Weapon Knowledge (Maestria em Armas) – Dano extra com armas." },
  { category: "Combate & Furtividade", title: "Archer (Arqueiro)", desc: "Um disparo, uma morte. A precisão letal é sua única lei.", extra: "Habilidade: Accuracy (Precisão) – Precisão aumentada com projéteis." },
  { category: "Combate & Furtividade", title: "Rogue (Ladino)", desc: "Mestres na arte da emboscada e do ataque furtivo.", extra: "Habilidade: Sneaky (Furtivo) – Seu nome nunca aparece através das paredes." },
  { category: "Combate & Furtividade", title: "Beastmaster (Mestre das Feras)", desc: "Preferem a lealdade dos animais ao convívio com as pessoas.", extra: "Habilidade: Fauna Friends (Amigo da Fauna) – Buff permanente para animais domesticados." },
  // COLETA & OFÍCIO
  { category: "Coleta & Ofício", title: "Miner (Minerador)", desc: "Especialistas em escavar as profundezas e achar tesouros.", extra: "Habilidade: Mining Expert – Minera mais rápido com picareta." },
  { category: "Coleta & Ofício", title: "Lumberjack (Lenhador)", desc: "As florestas tremem diante deles.", extra: "Habilidade: Timber! – Corta árvores inteiras de uma vez (exceto no sneak)." },
  { category: "Coleta & Ofício", title: "Farmer (Fazendeiro)", desc: "Garantem o sustento de todos com suas colheitas.", extra: "Habilidade: Bountiful Harvest – Chance de dobro na colheita." },
  { category: "Coleta & Ofício", title: "Rancher (Criador)", desc: "Mestres no trato animal e extração de recursos.", extra: "Habilidade: Twin Births – Chance de animais gerarem gêmeos." },
  { category: "Coleta & Ofício", title: "Blacksmith (Ferreiro)", desc: "Dominam a arte de forjar ferramentas e armaduras superiores.", extra: "Habilidade: High-Quality Equipment – Itens craftados têm buffs extras." },
  { category: "Coleta & Ofício", title: "Cook (Cozinheiro)", desc: "A alma de qualquer banquete.", extra: "Habilidade: Good Meals – Comida craftada sacia mais fome." },
  // SUPORTE & ESPECIAIS
  { category: "Suporte & Especiais", title: "Cleric (Clérigo)", desc: "Canalizam a magia mística a seu favor.", extra: "Habilidade: Extended Potions – Dobra a duração de poções usando caldeirão." },
  { category: "Suporte & Especiais", title: "Explorer (Explorador)", desc: "Mestres da navegação e mapas.", extra: "Habilidade: Explorer Kit – Começa com bússola, relógio e 9 mapas." },
  { category: "Suporte & Especiais", title: "Merchant (Mercador)", desc: "Negociantes natos sempre de olho em esmeraldas.", extra: "Habilidade: Restocking – Aldeões nunca ficam sem estoque." },
  { category: "Suporte & Especiais", title: "Nitwit (Vagabundo/Simplório)", desc: "Não levam muito jeito para fazer coisa alguma.", extra: null }
];

const ORIGINS_CATEGORIES = [
  { id: 'steel', title: "Os Remanescentes de Aço", flavor: "Guerreiros, protetores ou sobreviventes natos.", items: [{ title: "Human", desc: "Versatilidade pura." }, { title: "Variant Human", desc: "Especialistas adaptáveis." }, { title: "Knight", desc: "O escudo do grupo." }, { title: "Brute", desc: "Força avassaladora." }, { title: "Archer", desc: "Olhos de águia." }, { title: "Thief", desc: "A sombra nas ruínas." }, { title: "Dwarf", desc: "Mestre das profundezas." }, { title: "Half-Orc", desc: "Fúria controlada." }] },
  { id: 'mystery', title: "Os Filhos do Mistério", flavor: "Vocês não apenas veem a magia; vocês são feitos dela.", items: [{ title: "Mage", desc: "Canalizador de mana." }, { title: "Cleric", desc: "A luz na escuridão." }, { title: "Bard", desc: "A voz do destino." }, { title: "Elf", desc: "Graça ancestral." }, { title: "Half-Elf", desc: "Equilíbrio entre mundos." }, { title: "Dragonborn", desc: "Sangue do dragão." }, { title: "Valkyrie", desc: "Guerreira alada." }, { title: "Tiefling", desc: "Herança sombria." }, { title: "Djinn", desc: "Espírito do vento." }, { title: "Kitsune", desc: "Raposa ilusionista." }, { title: "Phoenix", desc: "Ciclo eterno." }] },
  { id: 'jungle', title: "Os Herdeiros da Selva", flavor: "O instinto é mais forte que a razão.", items: [{ title: "Feline", desc: "Predador ágil." }, { title: "Big Bad Wolf", desc: "Caçador noturno." }, { title: "Arachnid", desc: "Tecelão das sombras." }, { title: "Minotaur", desc: "Colosso do labirinto." }, { title: "Avian", desc: "Planador dos céus." }, { title: "Druid", desc: "Guardião da vida." }, { title: "Floran", desc: "Planta viva." }, { title: "Truffle", desc: "Fungo adaptável." }] },
  { id: 'planes', title: "Os Viajantes dos Planos", flavor: "Seus corpos anseiam pelo fogo, vazio ou profundezas.", items: [{ title: "Enderian", desc: "Filho do Vazio." }, { title: "Shulk", desc: "Fortaleza viva." }, { title: "Elytrian", desc: "Mestre dos ventos." }, { title: "Blazeborn", desc: "Nascido no fogo." }, { title: "Piglin", desc: "Mercenário dourado." }, { title: "Merling", desc: "Habitante do abismo." }, { title: "Little Mermaid", desc: "Magia das marés." }] },
  { id: 'tales', title: "Os Contos Vivos", flavor: "Saíram de um livro de histórias deixado aberto.", items: [{ title: "Gnome", desc: "Energia compacta." }, { title: "Halfling", desc: "Amante do conforto." }, { title: "Inchling", desc: "O minúsculo." }, { title: "Jack", desc: "Aventureiro dos feijões." }, { title: "Red Riding Hood", desc: "Sobrevivente da floresta." }, { title: "Cinderella", desc: "Magia do tempo." }, { title: "Sleeping Beauty", desc: "Sono reparador." }, { title: "Frog Prince", desc: "Nobre anfíbio." }] }
];

// --- COMPONENTE MENSAGEM ESTILIZADA ---
const MessageModal = ({ isOpen, onClose, title, message, type }) => {
  if (!isOpen) return null;
  const isError = type === 'error';
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in-up">
       <div className={`bg-[#1a0b2e] border-4 ${isError ? 'border-red-500' : 'border-cyan-400'} p-8 rounded-xl max-w-md w-full shadow-[0_0_50px_rgba(0,0,0,0.8)] text-center relative overflow-hidden`}>
          <div className={`absolute inset-0 opacity-20 ${isError ? 'bg-red-900' : 'bg-cyan-900'} blur-xl z-0`}></div>
          <div className="relative z-10">
            <h2 className={`font-medieval text-4xl ${isError ? 'text-red-500' : 'text-cyan-400'} mb-6 flex flex-col items-center justify-center gap-2 drop-shadow-md`}>
              {isError ? <AlertTriangle className="w-16 h-16 mb-2" /> : <Info className="w-16 h-16 mb-2" />} 
              {title}
            </h2>
            <p className="font-pixel text-2xl text-gray-200 mb-8 leading-relaxed tracking-wide">{message}</p>
            <button onClick={onClose} className={`w-full py-4 ${isError ? 'bg-red-600 hover:bg-red-700 border-red-800' : 'bg-cyan-600 hover:bg-cyan-700 border-cyan-800'} border-b-4 text-white font-pixel text-2xl rounded active:border-b-0 active:translate-y-1 transition-all shadow-lg`}>
              {isError ? 'Corrigir' : 'Entendido'}
            </button>
          </div>
       </div>
    </div>
  );
};

// --- COMPONENTE POPUP SERVIDOR (JOGAR) ---
const ServerInfoModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleCopy = () => {
    const text = 'personal-massage.gl.joinmc.link';
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
    } catch (err) {
      console.error('Falha ao copiar', err);
    }
    document.body.removeChild(textArea);
  };

  return (
     <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in-up">
        <div className="bg-[#0f0518] border-4 border-yellow-400 p-8 rounded-xl max-w-lg w-full shadow-[0_0_60px_rgba(234,179,8,0.3)] text-center relative">
           <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white font-bold text-2xl transition-colors">✕</button>
           
           <Gamepad2 className="w-20 h-20 text-yellow-400 mx-auto mb-4 animate-bounce" />
           <h2 className="font-medieval text-5xl text-yellow-400 mb-2 text-shadow">Junte-se à Aventura</h2>
           <p className="font-pixel text-xl text-yellow-100/60 mb-8 uppercase tracking-widest">O portal está aberto</p>
           
           <div className="mb-8 bg-[#1a0b2e] p-4 rounded-lg border border-yellow-500/30">
              <p className="font-pixel text-gray-400 text-lg mb-2 uppercase">IP do Servidor:</p>
              <div 
                className="group relative bg-black border-2 border-dashed border-yellow-500/50 p-4 rounded text-2xl md:text-3xl text-cyan-300 font-pixel tracking-wider cursor-pointer hover:bg-yellow-900/10 transition-all flex items-center justify-center gap-3" 
                onClick={handleCopy}
              >
                 <span>personal-massage.gl.joinmc.link</span>
                 <Copy className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" />
                 <span className="absolute -top-3 right-2 bg-yellow-600 text-black text-xs px-2 py-1 rounded opacity-0 group-active:opacity-100 transition-opacity font-bold font-sans">COPIADO!</span>
              </div>
              <p className="text-xs text-gray-500 mt-2 font-pixel tracking-wider">(Clique para copiar)</p>
           </div>

           <div className="mb-8">
              <p className="font-pixel text-gray-400 text-lg mb-2 uppercase">Modpack Obrigatório:</p>
              <a href="https://www.curseforge.com/minecraft/modpacks/hyturcraft-rpg" target="_blank" rel="noopener noreferrer" className="block bg-gradient-to-r from-[#2d1b3e] to-[#4a2e6b] hover:from-[#3d2b4e] hover:to-[#5a3e7b] border-2 border-fuchsia-500 text-fuchsia-100 hover:text-white font-pixel text-2xl p-4 rounded transition-all group shadow-lg hover:shadow-fuchsia-500/30 relative overflow-hidden">
                 <div className="relative z-10 flex items-center justify-center gap-3">
                   <ExternalLink className="w-6 h-6" />
                   HyturCraft RPG
                 </div>
              </a>
           </div>

           <button onClick={onClose} className="w-full py-4 bg-yellow-600 hover:bg-yellow-500 text-black font-bold font-pixel text-2xl rounded shadow-lg border-b-4 border-yellow-800 active:border-b-0 active:translate-y-1 transition-all">
              FECHAR
           </button>
        </div>
     </div>
  );
}

// --- COMPONENTE CARD ORIGEM ---
const Card = ({ data, onClick }) => {
  const cardRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [leaveTimeout, setLeaveTimeout] = useState(null);

  useEffect(() => {
    if (cardRef.current) {
      setDimensions({ width: cardRef.current.offsetWidth, height: cardRef.current.offsetHeight });
    }
  }, []);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMouse({ x: e.clientX - rect.left - rect.width / 2, y: e.clientY - rect.top - rect.height / 2 });
  };

  const handleMouseLeave = () => {
    setLeaveTimeout(setTimeout(() => setMouse({ x: 0, y: 0 }), 1000));
  };

  const handleMouseEnter = () => leaveTimeout && clearTimeout(leaveTimeout);

  const rX = (mouse.x / dimensions.width || 0) * 30;
  const rY = (mouse.y / dimensions.height || 0) * -30;
  const tX = (mouse.x / dimensions.width || 0) * -40;
  const tY = (mouse.y / dimensions.height || 0) * -40;

  return (
    <div className="card-wrap group" ref={cardRef} onMouseMove={handleMouseMove} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onClick={onClick}>
      <div className="card border-2 border-[#4a2e6b] group-hover:border-cyan-400 transition-colors duration-300" style={{ transform: `rotateY(${rX}deg) rotateX(${rY}deg)` }}>
        <div className="card-bg" style={{ transform: `translateX(${tX}px) translateY(${tY}px)`, backgroundImage: `url('${getAssetPath(data.title)}')` }}></div>
        <div className="card-info bg-black/60 backdrop-blur-sm p-4 border-t-2 border-[#4a2e6b]">
          <h1 className="font-pixel text-3xl text-yellow-400 tracking-wider mb-2 drop-shadow-md">{data.title}</h1>
          <p className="font-pixel text-xl text-gray-200 leading-tight">{data.desc}</p>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE LORE ---
const LorePage = ({ onBack }) => {
  const [meteorStyle, setMeteorStyle] = useState({ top: '10%', animationDuration: '4s', animationDelay: '0s' });
  const [triggerMeteor, setTriggerMeteor] = useState(0);

  useEffect(() => {
    const randomizeMeteor = () => {
      setMeteorStyle({
        top: `${Math.floor(Math.random() * 60) + 5}%`,
        animationDuration: '3.5s',
        animationDelay: `${Math.floor(Math.random() * 10) + 2}s`
      });
    };
    randomizeMeteor();
    const interval = setInterval(() => { setTriggerMeteor(p => p + 1); randomizeMeteor(); }, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-screen bg-[#050011] overflow-hidden flex flex-col items-center font-medieval">
      <button onClick={onBack} className="absolute top-8 left-8 z-50 text-fuchsia-400 hover:text-white flex items-center gap-2 transition-colors font-bold text-xl"><ArrowLeft /> Voltar</button>
      <div className="star-wars-fade absolute top-0 w-full h-32 bg-gradient-to-b from-[#050011] to-transparent z-20"></div>
      <div key={triggerMeteor} className="meteor-pass" style={meteorStyle}></div>
      <div className="star-wars-container relative w-full h-full flex justify-center perspective-400 overflow-hidden">
        <div className="crawl-content absolute text-justify text-fuchsia-300 font-bold text-5xl leading-loose w-[90%] max-w-6xl origin-[50%_100%] animate-crawl drop-shadow-[0_0_10px_rgba(255,0,255,0.5)] top-[100%]">
          <div className="text-center mb-24">
            <h2 className="text-8xl mb-6 text-cyan-300 font-medieval">EPISÓDIO I</h2>
            <h1 className="text-9xl mb-12 text-fuchsia-500 font-medieval uppercase">O ETERNO RETORNO</h1>
          </div>
          <p className="mb-12 font-pixel text-5xl leading-relaxed">O tempo é um círculo quebrado. O GRANDE CLARÃO VIOLETA queimou os céus...</p>
          <p className="mb-12 font-pixel text-5xl leading-relaxed">Dois mil anos se passaram. Das cinzas do que fomos, nasceu o ÉDEN...</p>
          <p className="mb-12 font-pixel text-5xl leading-relaxed">Mas o silêncio das estrelas chegou ao fim. O universo começou a devolver o que roubou...</p>
          <p className="mb-32 font-pixel text-5xl leading-relaxed">Na mística FONTE DE AION, as águas voltam a brilhar. Os RETORNADOS devem agora caminhar...</p>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE HOME ---
const HomePage = ({ setPage, onOpenServer }) => (
  <div className="relative w-full h-screen bg-[#0f0518] flex flex-col items-center justify-center overflow-hidden">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-fuchsia-900/40 via-[#1a0b2e] to-black"></div>
    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] animate-pulse"></div>
    <div className="z-10 text-center animate-fade-in-up flex flex-col items-center p-4">
      <div className="mb-6 animate-float">
        <img src="assets/logo.png" alt="Les Revenants Logo" className="w-40 h-40 object-contain drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
      </div>
      <h1 className="font-medieval text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-fuchsia-400 via-purple-500 to-cyan-500 drop-shadow-[0_0_25px_rgba(168,85,247,0.6)] mb-2 tracking-wide">Les Revenants</h1>
      <h2 className="font-pixel text-2xl md:text-4xl text-fuchsia-100 mb-12 uppercase border-b-2 border-fuchsia-500/50 pb-4 tracking-widest text-shadow-sm">Seja bem-vindo às terras de ÉDEN</h2>
      
      <div className="flex flex-col md:flex-row gap-6 justify-center items-center w-full max-w-md md:max-w-none mb-8">
        <button onClick={() => setPage('origins')} className="relative px-8 md:px-12 py-5 bg-[#4a2e6b] hover:bg-[#6b3e9e] border-4 border-[#2d1b3e] hover:border-cyan-400 text-yellow-400 font-pixel text-2xl md:text-3xl shadow-[0_4px_0_rgba(0,0,0,0.5)] active:shadow-none active:translate-y-1 transition-all w-full md:w-auto"><span className="relative z-10 flex items-center justify-center gap-3"><Sparkles className="w-6 h-6"/> CRIAR PERSONAGEM</span></button>
        <button onClick={() => setPage('participants')} className="px-8 md:px-12 py-5 bg-[#2d1b3e] border-4 border-purple-500/50 text-purple-300 hover:text-white hover:border-purple-300 font-pixel text-2xl md:text-3xl transition-all hover:scale-105 w-full md:w-auto flex items-center justify-center gap-2"><Users className="w-6 h-6"/> PARTICIPANTES</button>
        <button onClick={() => setPage('lore')} className="px-8 md:px-12 py-5 bg-transparent border-4 border-cyan-500/50 text-cyan-400 hover:text-cyan-200 hover:border-cyan-300 font-pixel text-2xl md:text-3xl transition-all hover:scale-105 w-full md:w-auto">LORE</button>
      </div>

      {/* Botão JOGAR */}
      <button 
        onClick={onOpenServer}
        className="px-6 py-2 bg-transparent text-yellow-500/60 hover:text-yellow-400 border border-yellow-500/20 hover:border-yellow-500/60 rounded-full font-pixel text-xl tracking-widest transition-all hover:scale-105 hover:bg-yellow-900/10 flex items-center gap-2"
      >
        <Gamepad2 className="w-4 h-4" /> JOGAR
      </button>

    </div>
  </div>
);

// --- COMPONENTE PARTICIPANTES (VER E APAGAR) ---
const ParticipantsPage = ({ participants, onDelete, onBack, showMessage }) => {
  const [deleteId, setDeleteId] = useState(null);
  const [confirmNick, setConfirmNick] = useState("");

  const confirmDelete = () => {
    const target = participants.find(p => p.id === deleteId);
    if (!target) return; // Segurança

    if (confirmNick === target.nick) {
      onDelete(deleteId);
      setDeleteId(null);
      setConfirmNick("");
    } else {
      // Erro estilizado
      showMessage(
        "A Alma Resiste", 
        "O Nick digitado está incorreto. O vínculo não pode ser quebrado sem o Nome Verdadeiro exato.", 
        "error"
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0510] py-10 flex flex-col items-center overflow-x-hidden text-fuchsia-50 relative">
      <div className="fixed inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 pointer-events-none"></div>
      <div className="w-full max-w-7xl px-8 flex justify-between items-center mb-12 relative z-10">
        <button onClick={onBack} className="text-cyan-400 hover:text-white font-medieval text-xl font-bold flex items-center gap-2"><ArrowLeft /> Voltar ao Menu</button>
        <h1 className="font-medieval text-5xl text-white uppercase tracking-widest text-shadow">Almas Retornadas</h1>
        <div className="w-32"></div>
      </div>

      {participants.length === 0 ? (
        <div className="text-center mt-20 opacity-50 font-pixel text-2xl">
          <Ghost className="w-20 h-20 mx-auto mb-4"/>
          Nenhuma alma foi registrada ainda...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-7xl px-6 relative z-10">
          {participants.map((p) => (
            <div key={p.id} className="bg-[#1a0b2e] border-2 border-[#4a2e6b] rounded-xl overflow-hidden shadow-lg hover:shadow-cyan-500/20 transition-all flex flex-col">
              <div className="h-24 bg-gradient-to-r from-fuchsia-900 to-purple-900 relative">
                <div className="absolute -bottom-8 left-6 w-16 h-16 rounded-full border-2 border-cyan-400 overflow-hidden bg-black">
                  <img src={getOriginAsset(p.origin)} className="w-full h-full object-cover"/>
                </div>
                <div className="absolute top-2 right-2 p-2 bg-black/50 rounded-lg border border-white/10">
                  <img src={getClassAsset(p.class)} className="w-8 h-8 object-contain"/>
                </div>
              </div>
              <div className="pt-10 px-6 pb-6 flex-grow">
                <h2 className="font-medieval text-3xl text-white">{p.charName}</h2>
                <div className="font-pixel text-xl text-cyan-400 mb-4">@{p.nick}</div>
                <div className="flex gap-2 text-sm font-pixel text-gray-400 mb-4">
                  <span className="bg-[#0f0518] px-2 py-1 rounded border border-[#2d1b3e]">{p.origin}</span>
                  <span className="bg-[#0f0518] px-2 py-1 rounded border border-[#2d1b3e]">{p.class}</span>
                </div>
                <p className="font-pixel text-gray-300 italic text-sm line-clamp-3">"{p.lore}"</p>
              </div>
              <div className="p-4 border-t border-[#2d1b3e] bg-[#0f0518] flex justify-end">
                <button onClick={() => setDeleteId(p.id)} className="text-red-500 hover:text-red-300 transition-colors flex items-center gap-2 font-pixel text-lg">
                  <Trash2 className="w-4 h-4"/> Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL DE EXCLUSÃO */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#1a0b2e] border-2 border-red-500 p-8 rounded-xl max-w-md w-full shadow-[0_0_50px_rgba(239,68,68,0.3)] animate-fade-in-up">
            <h2 className="font-medieval text-3xl text-red-500 mb-4 flex items-center gap-2">
              <AlertTriangle /> Romper Vínculo
            </h2>
            <p className="font-pixel text-xl text-gray-300 mb-6">
              Para apagar esta alma da existência, digite o <strong>Nick do Jogador</strong> vinculado a ela.
            </p>
            <input 
              type="text" 
              value={confirmNick} 
              onChange={(e) => setConfirmNick(e.target.value)} 
              className="w-full bg-[#0a0510] border border-red-500/50 text-white font-pixel text-2xl p-3 rounded mb-2 focus:outline-none focus:border-red-500"
              placeholder="Digite o nick aqui..."
            />
            <div className="flex gap-4 mt-6">
              <button onClick={() => {setDeleteId(null); setConfirmNick("");}} className="flex-1 py-3 bg-transparent border border-gray-600 text-gray-300 font-pixel text-xl rounded hover:bg-gray-800">Cancelar</button>
              <button onClick={confirmDelete} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-pixel text-xl rounded shadow-lg">Apagar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- COMPONENTE CRIAÇÃO DE PERSONAGEM ---
const CharacterCreationPage = ({ origin, characterClass, onBack, onFinish, isSaving, showMessage }) => {
  const [formData, setFormData] = useState({ charName: "", lore: "", items: "" });
  const [showNickModal, setShowNickModal] = useState(false);
  const [gameNick, setGameNick] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSave = () => {
    // Validação Estilizada
    if (!formData.charName.trim()) {
      showMessage("Identidade Incompleta", "Sua alma precisa de um nome para ser lembrada nas crônicas.", "error");
      return;
    }
    if (!formData.lore.trim()) {
      showMessage("Memória Vazia", "Mesmo que turva, alguma lembrança do passado deve ser registrada na Lore.", "error");
      return;
    }
    setShowNickModal(true);
  };

  const confirmCreation = () => {
    // Validação Estilizada
    if (!gameNick.trim()) {
      showMessage("Jogador Desconhecido", "O Nick do Jogo é necessário para vincular sua alma ao servidor.", "error");
      return;
    }

    onFinish({
      ...formData,
      nick: gameNick,
      origin: origin.title,
      class: characterClass.title
    });
  };

  const handleAutoGenerate = async () => {
    setIsGenerating(true);
    const apiKey = ""; // Chave fornecida pelo ambiente
    const prompt = `Crie um personagem de RPG para o cenário "Éden" (mundo pós-apocalíptico mágico).
    Origem: ${origin.title}
    Classe: ${characterClass.title}

    Responda APENAS com um JSON válido neste formato:
    {
      "charName": "Nome criativo e temático",
      "lore": "Uma história curta (max 300 caracteres) em primeira pessoa mencionando uma memória vaga do passado (fragmento), sentimento sobre o corpo atual e um objetivo.",
      "items": "Um item especial trazido do passado (ex: um relógio parado, uma chave enferrujada)."
    }`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });
      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (generatedText) {
         const parsed = JSON.parse(generatedText);
         setFormData({
           charName: parsed.charName,
           lore: parsed.lore,
           items: parsed.items
         });
      }
    } catch (e) {
      console.error(e);
      showMessage("Erro na Magia", "A inspiração falhou. Tente novamente.", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0518] py-8 flex flex-col items-center overflow-x-hidden text-fuchsia-50 relative">
      <div className="fixed inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 pointer-events-none"></div>
      
      {/* Header */}
      <div className="w-full max-w-7xl px-8 flex justify-between items-center mb-8 relative z-10">
        <button onClick={onBack} className="text-cyan-400 hover:text-white font-medieval text-xl font-bold flex items-center gap-2"><ArrowLeft /> Voltar</button>
        <h1 className="font-medieval text-4xl text-white uppercase tracking-widest text-shadow">Registro de Alma</h1>
        <div className="w-32"></div>
      </div>

      <div className="w-full max-w-7xl px-4 grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        {/* Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#1a0b2e]/80 border-2 border-[#4a2e6b] p-8 rounded-xl shadow-2xl backdrop-blur-md">
            <div className="flex gap-4 mb-8 border-b border-[#4a2e6b] pb-6">
              <div className="flex-1 bg-[#0f0518] p-4 rounded border border-[#2d1b3e] flex items-center gap-3">
                <div className="w-12 h-12 bg-black rounded-full overflow-hidden border border-fuchsia-500"><img src={getOriginAsset(origin.title)} className="w-full h-full object-cover"/></div>
                <div><div className="text-xs text-fuchsia-400 uppercase tracking-widest">Origem</div><div className="font-pixel text-2xl text-white">{origin.title}</div></div>
              </div>
              <div className="flex-1 bg-[#0f0518] p-4 rounded border border-[#2d1b3e] flex items-center gap-3">
                <div className="w-12 h-12 bg-black rounded-full overflow-hidden border border-cyan-500 p-1"><img src={getClassAsset(characterClass.title)} className="w-full h-full object-contain"/></div>
                <div><div className="text-xs text-cyan-400 uppercase tracking-widest">Classe</div><div className="font-pixel text-2xl text-white">{characterClass.title}</div></div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block font-medieval text-2xl text-yellow-400 mb-2">Nome do Retornado</label>
                <input type="text" value={formData.charName} onChange={e => setFormData({...formData, charName: e.target.value})} className="w-full bg-[#0a0510] border border-[#4a2e6b] text-white font-pixel text-2xl p-4 rounded focus:border-cyan-400 focus:outline-none" placeholder="Como você se chama nesta vida?" />
              </div>
              <div>
                <label className="block font-medieval text-2xl text-yellow-400 mb-2">História & Memórias</label>
                <p className="text-sm text-fuchsia-300/60 mb-2 font-pixel">Quem você acha que foi? O que você lembra do Vazio?</p>
                <textarea value={formData.lore} onChange={e => setFormData({...formData, lore: e.target.value})} className="w-full h-40 bg-[#0a0510] border border-[#4a2e6b] text-white font-pixel text-xl p-4 rounded focus:border-cyan-400 focus:outline-none resize-none" placeholder="Escreva aqui sua lore..."></textarea>
              </div>
              <div>
                <label className="block font-medieval text-2xl text-yellow-400 mb-2">Itens Especiais</label>
                <p className="text-sm text-fuchsia-300/60 mb-2 font-pixel">Algo que você trouxe consigo?</p>
                <textarea value={formData.items} onChange={e => setFormData({...formData, items: e.target.value})} className="w-full h-24 bg-[#0a0510] border border-[#4a2e6b] text-white font-pixel text-xl p-4 rounded focus:border-cyan-400 focus:outline-none resize-none" placeholder="Ex: Um medalhão quebrado..."></textarea>
              </div>
              <button disabled={isSaving} onClick={handleSave} className="w-full py-4 bg-gradient-to-r from-fuchsia-700 to-purple-800 hover:from-fuchsia-600 hover:to-purple-700 text-white font-medieval text-2xl rounded shadow-lg border border-fuchsia-500/50 flex items-center justify-center gap-2 group transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed">
                {isSaving ? "VINCULANDO..." : <><Save className="w-6 h-6 group-hover:animate-bounce"/> CONCLUIR CRIAÇÃO</>}
              </button>
            </div>
          </div>
        </div>

        {/* Guia */}
        <div className="lg:col-span-1">
          <div className="bg-[#150a20] border-2 border-cyan-500/30 p-6 rounded-xl shadow-lg h-full sticky top-8">
            <h2 className="font-medieval text-3xl text-cyan-400 mb-6 flex items-center gap-2 border-b border-cyan-500/30 pb-4"><Feather className="w-6 h-6"/> Guia: Mémoire Vive</h2>
            {/* Scroll removido: agora o conteúdo flui livremente */}
            <div className="space-y-6">
              
              <div className="space-y-2">
                <h3 className="font-medieval text-xl text-fuchsia-300">1. O Cenário (Éden)</h3>
                <p className="font-pixel text-lg text-gray-400 leading-relaxed">
                  Um mundo pós-apocalíptico mágico. A lógica quebrou: ilhas flutuam e ruínas tecnológicas antigas cobrem a terra.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-medieval text-xl text-fuchsia-300">2. Você (O Retornado)</h3>
                <p className="font-pixel text-lg text-gray-400 leading-relaxed">
                  Uma alma antiga que caiu do Vazio na Fonte de Aion. Você acordou sem memórias, apenas com fragmentos.
                </p>
              </div>

              <div className="bg-[#0a0510] p-5 rounded border border-yellow-500/30 mt-4 shadow-[0_0_15px_rgba(234,179,8,0.1)]">
                <h3 className="font-medieval text-xl text-yellow-400 mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5"/> 3 Perguntas para Lore:
                </h3>
                <ul className="list-disc list-inside font-pixel text-lg text-gray-300 space-y-4">
                  <li>
                    <strong className="text-fuchsia-300">Resquício:</strong> Qual sua única lembrança? <span className="text-gray-500 text-sm">(Cheiro, som, imagem).</span>
                  </li>
                  <li>
                    <strong className="text-fuchsia-300">Sentimento:</strong> Ama ou odeia seu novo corpo?
                  </li>
                  <li>
                    <strong className="text-fuchsia-300">Caminho:</strong> Qual seu objetivo? <span className="text-gray-500 text-sm">(Verdade, glória ou sobrevivência?)</span>
                  </li>
                </ul>
              </div>

              {/* BOTÃO MÁGICO (GEMINI) */}
              <button 
                onClick={handleAutoGenerate}
                disabled={isGenerating}
                className="w-full mt-4 py-3 bg-cyan-900/30 hover:bg-cyan-900/50 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 hover:text-cyan-100 font-pixel text-lg rounded transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {isGenerating ? (
                  <span className="animate-pulse">Consultando os astros...</span>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 group-hover:rotate-12 transition-transform"/> Invocar Inspiração (IA)
                  </>
                )}
              </button>

            </div>
          </div>
        </div>
      </div>

      {/* MODAL NICKNAME */}
      {showNickModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in-up">
          <div className="bg-gradient-to-b from-[#2d1b3e] to-[#0a0510] border-4 border-yellow-400 p-8 rounded-xl max-w-lg w-full shadow-[0_0_60px_rgba(234,179,8,0.2)] text-center">
            <User className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h2 className="font-medieval text-4xl text-yellow-400 mb-2">Identifique-se</h2>
            <p className="font-pixel text-xl text-gray-300 mb-8">Digite seu <strong>NICK NO JOGO</strong> para vincular esta alma ao banco de dados eterno.</p>
            <input 
              type="text" 
              autoFocus
              value={gameNick}
              onChange={(e) => setGameNick(e.target.value)}
              className="w-full bg-black border-2 border-yellow-400/50 text-yellow-100 font-pixel text-3xl p-4 rounded mb-8 text-center focus:outline-none focus:border-yellow-400 shadow-inner"
              placeholder="Seu Nick..."
            />
            <div className="flex gap-4">
              <button onClick={() => setShowNickModal(false)} className="flex-1 py-4 bg-transparent border-2 border-gray-600 text-gray-400 font-pixel text-xl rounded hover:border-gray-400 hover:text-white transition-all">Cancelar</button>
              <button disabled={isSaving} onClick={confirmCreation} className="flex-1 py-4 bg-yellow-600 hover:bg-yellow-500 text-black font-bold font-pixel text-xl rounded shadow-[0_0_20px_rgba(234,179,8,0.4)] transition-all">
                {isSaving ? "VINCULANDO..." : "VINCULAR ALMA"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- COMPONENTE SELEÇÃO DE CLASSE & ORIGEM (MANTIDOS) ---
const OriginsPage = ({ onBack, onSelectOrigin }) => { 
  return (
    <div className="min-h-screen bg-[#13001e] py-10 flex flex-col items-center overflow-x-hidden relative">
      <div className="fixed inset-0 bg-[linear-gradient(rgba(100,0,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(100,0,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
      <div className="w-full max-w-7xl px-8 flex flex-col md:flex-row justify-between items-center mb-12 relative z-10">
        <button onClick={onBack} className="text-fuchsia-400 hover:text-white font-medieval text-xl font-bold flex items-center gap-2 z-50"><ArrowLeft /> Voltar ao Menu</button>
        <div className="text-center"><h1 className="font-medieval text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400 drop-shadow-lg tracking-wide">ESCOLHA SUA ORIGEM</h1><p className="font-pixel text-fuchsia-200/80 text-xl md:text-2xl mt-2 tracking-widest uppercase">Sua alma clama por um corpo</p></div>
        <div className="w-24 hidden md:block"></div>
      </div>
      <div className="w-full max-w-[1400px] flex flex-col gap-20 pb-20 relative z-10">
        {ORIGINS_CATEGORIES.map((category) => (
          <div key={category.id} className="flex flex-col items-center animate-fade-in-up">
            <div className="w-full max-w-4xl px-6 text-center mb-10 bg-black/40 p-6 rounded-lg border border-fuchsia-500/20 backdrop-blur-sm">
              <h2 className="font-pixel text-4xl md:text-5xl text-yellow-400 uppercase tracking-widest border-b-2 border-fuchsia-500/20 pb-4 mb-4 drop-shadow-md">{category.title}</h2>
              <p className="font-pixel text-2xl text-cyan-200/90 leading-relaxed max-w-2xl mx-auto">"{category.flavor}"</p>
            </div>
            <div className="flex flex-wrap justify-center px-4 w-full">
              {category.items.map((origin, idx) => (
                <Card key={`${category.id}-${idx}`} data={origin} onClick={() => onSelectOrigin(origin)} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ClassesPage = ({ onBack, origin, onSelectClass }) => {
  const classesByCategory = CLASSES_DATA.reduce((acc, cls) => { if (!acc[cls.category]) acc[cls.category] = []; acc[cls.category].push(cls); return acc; }, {});
  const categoriesOrder = ["Combate & Furtividade", "Coleta & Ofício", "Suporte & Especiais"];
  return (
    <div className="min-h-screen bg-[#0a0510] py-10 flex flex-col items-center overflow-x-hidden text-fuchsia-50">
      <div className="w-full max-w-7xl px-8 flex flex-col md:flex-row justify-between items-center mb-12">
        <button onClick={onBack} className="text-cyan-400 hover:text-white font-medieval text-xl font-bold flex items-center gap-2 z-50"><ArrowLeft /> Escolher outra Origem</button>
        <div className="text-center"><div className="font-pixel text-xl font-bold text-fuchsia-500 uppercase tracking-widest mb-2">Origem: {origin.title}</div><h1 className="font-medieval text-5xl md:text-7xl font-bold text-white drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">ESCOLHA SUA CLASSE</h1><p className="font-pixel text-2xl text-cyan-300/60 mt-2">Qual será o destino da sua alma?</p></div>
        <div className="w-24 hidden md:block"></div>
      </div>
      <div className="w-full max-w-7xl px-6 pb-20 flex flex-col gap-16">
        {categoriesOrder.map((catName) => (
          <div key={catName} className="animate-fade-in-up">
            <h2 className="font-pixel text-4xl font-bold text-cyan-400 uppercase tracking-widest border-b border-cyan-500/20 pb-2 mb-8 ml-2 flex items-center gap-3"><Sparkles className="w-6 h-6"/> {catName}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {classesByCategory[catName].map((cls, idx) => (
                <div key={idx} onClick={() => onSelectClass(cls)} className="group relative bg-[#150a20] border-2 border-[#2d1b3e] rounded-xl p-6 hover:bg-[#200e30] hover:border-yellow-400 transition-all duration-300 cursor-pointer hover:shadow-[0_0_25px_rgba(192,38,211,0.25)] hover:-translate-y-2 flex flex-col h-full overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-fuchsia-500/10 blur-[40px] rounded-full group-hover:bg-fuchsia-500/20 transition-all"></div>
                  <div className="flex items-center gap-4 mb-4 border-b border-[#2d1b3e] pb-4 group-hover:border-fuchsia-500/50 transition-colors relative z-10">
                    <div className="p-3 bg-[#0a0510] rounded-lg text-cyan-400 group-hover:bg-fuchsia-600 group-hover:text-white transition-all shadow-lg border border-[#2d1b3e]">
                      <img src={getClassAsset(cls.title)} className="w-12 h-12 object-contain filter drop-shadow-md" onError={(e) => {e.target.style.display = 'none';}} />
                    </div>
                    <h3 className="font-pixel text-2xl font-bold text-fuchsia-100 group-hover:text-white">{cls.title}</h3>
                  </div>
                  <p className="font-pixel text-xl text-gray-400 leading-tight mb-4 flex-grow group-hover:text-gray-300">{cls.desc}</p>
                  {cls.extra && <div className="mt-auto p-3 bg-[#0f0716] rounded text-lg text-cyan-300 border border-cyan-500/20 font-pixel group-hover:border-cyan-400/50">{cls.extra}</div>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- MAIN APP ---
export default function App() {
  const [page, setPage] = useState('home');
  const [selectedOrigin, setSelectedOrigin] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [user, setUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Estados dos Modais
  const [messageModal, setMessageModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const [showServerModal, setShowServerModal] = useState(false);

  // Função helper para exibir mensagens
  const showMessage = (title, message, type = 'info') => {
    setMessageModal({ isOpen: true, title, message, type });
  };

  // 1. Inicializa Autenticação
  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // 2. Escuta Firestore em Tempo Real
  useEffect(() => {
    if (!user) return;

    // Coleção Pública para que todos vejam a lista
    const participantsRef = collection(db, 'artifacts', appId, 'public', 'data', 'participants');
    
    // Listener
    const unsubscribe = onSnapshot(participantsRef, (snapshot) => {
      const loaded = snapshot.docs.map(doc => ({
        id: doc.id, // O ID do Firestore é crucial para exclusão
        ...doc.data()
      }));
      
      // Ordena por data de criação (recente primeiro) via JS
      loaded.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      
      setParticipants(loaded);
    }, (error) => {
      console.error("Erro ao carregar participantes:", error);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSelectOrigin = (origin) => { setSelectedOrigin(origin); setPage('classes'); };
  const handleSelectClass = (cls) => { setSelectedClass(cls); setPage('create_character'); };
  
  const handleFinishCreation = async (characterData) => {
    if (!user) return;
    setIsSaving(true);
    try {
      const docData = {
        ...characterData,
        createdAt: Date.now() // Timestamp para ordenação
      };
      // Salva na coleção pública
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'participants'), docData);
      setPage('participants');
    } catch (error) {
      console.error("Erro ao salvar:", error);
      showMessage("Erro no Vínculo", "Ocorreu uma falha na comunicação com a Fonte de Aion. Tente novamente.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteParticipant = async (id) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'participants', id));
    } catch (error) {
      console.error("Erro ao deletar:", error);
      showMessage("Vínculo Indestrutível", "Um erro desconhecido impede que esta alma seja apagada.", "error");
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=MedievalSharp&family=VT323&display=swap');
        .font-medieval { font-family: 'MedievalSharp', cursive; }
        .font-pixel { font-family: 'VT323', monospace; }
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #0a0510; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #4a2e6b; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #06b6d4; }
        :root { --hoverEasing: cubic-bezier(0.23, 1, 0.32, 1); --returnEasing: cubic-bezier(0.445, 0.05, 0.55, 0.95); }
        .card-wrap { margin: 10px; transform: perspective(800px); transform-style: preserve-3d; cursor: pointer; width: 240px; height: 320px; flex: 0 0 240px; }
        .card-wrap:hover .card-info { transform: translateY(0); }
        .card-wrap:hover .card-info p { opacity: 1; }
        .card-wrap:hover .card-info, .card-wrap:hover .card-info p { transition: 0.6s var(--hoverEasing); }
        .card-wrap:hover .card-info:after { transition: 5s var(--hoverEasing); opacity: 1; transform: translateY(0); }
        .card-wrap:hover .card-bg { transition: 0.6s var(--hoverEasing), opacity 5s var(--hoverEasing); opacity: 0.8; }
        .card-wrap:hover .card { transition: 0.6s var(--hoverEasing), box-shadow 2s var(--hoverEasing); box-shadow: rgba(255, 0, 255, 0.3) 0 0 40px 5px, rgba(0, 255, 255, 0.8) 0 0 0 1px, rgba(0, 0, 0, 0.8) 0 30px 60px 0, inset #2d1b3e 0 0 0 5px, inset white 0 0 0 2px; }
        .card { position: relative; width: 100%; height: 100%; background-color: #1a0b2e; overflow: hidden; border-radius: 10px; box-shadow: rgba(0, 0, 0, 0.66) 0 30px 60px 0, inset #1a0b2e 0 0 0 5px, inset rgba(168, 85, 247, 0.3) 0 0 0 2px; transition: 1s var(--returnEasing); }
        .card-bg { opacity: 0.5; position: absolute; top: -20px; left: -20px; width: 120%; height: 120%; padding: 20px; background-repeat: no-repeat; background-position: center; background-size: cover; background-color: #2d1b3e; transition: 1s var(--returnEasing), opacity 5s 1s var(--returnEasing); pointer-events: none; }
        .card-info { padding: 20px; position: absolute; bottom: 0; color: #fff; transform: translateY(40%); width: 100%; transition: 0.6s 1.6s cubic-bezier(0.215, 0.61, 0.355, 1); }
        .card-info p { opacity: 0; text-shadow: rgba(0, 0, 0, 1) 0 2px 3px; line-height: 1.1em; transition: 0.6s 1.6s cubic-bezier(0.215, 0.61, 0.355, 1); color: #e0e7ff; }
        .card-info * { position: relative; z-index: 1; }
        .card-info:after { content: ''; position: absolute; top: 0; left: 0; z-index: 0; width: 100%; height: 100%; background-image: linear-gradient(to bottom, transparent 0%, rgba(20, 0, 40, 0.9) 100%); background-blend-mode: overlay; opacity: 0; transform: translateY(100%); transition: 5s 1s var(--returnEasing); }
        .perspective-400 { perspective: 400px; }
        .animate-crawl { animation: crawl 65s linear infinite; transform: rotateX(25deg); }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .meteor-pass { position: absolute; left: -10%; width: 200px; height: 2px; background: linear-gradient(90deg, rgba(255,255,255,0), rgba(255,0,255,0.8)); box-shadow: 0 0 10px 2px rgba(255,0,255,0.5); transform: rotate(45deg); animation-name: meteor-fly; animation-timing-function: linear; opacity: 0; z-index: 10; }
        @keyframes meteor-fly { 0% { transform: rotate(45deg) translateX(0); opacity: 0; } 10% { opacity: 1; } 40% { transform: rotate(45deg) translateX(200vw); opacity: 0; } 100% { transform: rotate(45deg) translateX(200vw); opacity: 0; } }
        @keyframes crawl { 0% { top: 100%; opacity: 1; } 90% { opacity: 1; } 100% { top: -200%; opacity: 0; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fadeInUp 1s ease-out forwards; }
      `}</style>

      {page === 'home' && <HomePage setPage={setPage} onOpenServer={() => setShowServerModal(true)} />}
      {page === 'lore' && <LorePage onBack={() => setPage('home')} />}
      {page === 'origins' && <OriginsPage onBack={() => setPage('home')} onSelectOrigin={handleSelectOrigin} />}
      {page === 'classes' && selectedOrigin && <ClassesPage origin={selectedOrigin} onBack={() => setPage('origins')} onSelectClass={handleSelectClass} />}
      {page === 'create_character' && selectedOrigin && selectedClass && <CharacterCreationPage origin={selectedOrigin} characterClass={selectedClass} onBack={() => setPage('classes')} onFinish={handleFinishCreation} isSaving={isSaving} showMessage={showMessage} />}
      {page === 'participants' && <ParticipantsPage participants={participants} onDelete={handleDeleteParticipant} onBack={() => setPage('home')} showMessage={showMessage} />}

      {/* MODAIS GLOBAIS */}
      <MessageModal 
        isOpen={messageModal.isOpen} 
        onClose={() => setMessageModal({ ...messageModal, isOpen: false })} 
        title={messageModal.title} 
        message={messageModal.message} 
        type={messageModal.type} 
      />
      <ServerInfoModal isOpen={showServerModal} onClose={() => setShowServerModal(false)} />
    </>
  );
}