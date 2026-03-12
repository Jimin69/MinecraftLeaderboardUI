import { useRef, useState, useEffect, useCallback } from 'react';
import { useMCTextShadow } from './hooks/useMCTextShadow';
import Leaderboard from './components/Leaderboard';
import './App.css';
import unknownPlayer from './assets/unknown.png';

const API = 'http://217.182.65.56/api2/socialtest/index.php';
const sortPlayers = (list) => [...list].sort((a, b) => b.score - a.score);
const minotarUrl  = (name) => `https://minotar.net/helm/${encodeURIComponent(name) || 'MHF_Steve'}/100.png`;

function App() {
  const rootRef = useRef(null);
  useMCTextShadow(rootRef);

  const [players,       setPlayers]       = useState([]);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [inputName,     setInputName]     = useState('');
  const [inputScore,    setInputScore]    = useState('');
  const [imagePreview,  setImagePreview]  = useState(null);
  const [scoreStates,   setScoreStates]   = useState({});
  const scrollRef = useRef(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const fetchPlayers = useCallback(async () => {
    try {
      const res  = await fetch(API);
      const data = await res.json();
      setPlayers(sortPlayers(data));
    } catch (e) {
      console.error('Failed to fetch players', e);
    }
  }, []);

  useEffect(() => { fetchPlayers(); }, [fetchPlayers]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const check = () => {
      setCanScrollUp(el.scrollTop > 0);
      setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 1);
    };

    check();
    el.addEventListener('scroll', check);
    const ro = new ResizeObserver(check);
    ro.observe(el);

    return () => {
      el.removeEventListener('scroll', check);
      ro.disconnect();
    };
  }, [players]);

  const handleVote = async (id, type) => {
    setScoreStates({ [id]: type === 'up' ? 'up' : 'down' });
    setPlayers(prev =>
      sortPlayers(prev.map(p =>
        p.id === id ? { ...p, score: p.score + (type === 'up' ? 1 : -1) } : p
      ))
    );
    try {
      await fetch(`${API}?action=vote&id=${id}&type=${type}`, { method: 'POST' });
    } catch (e) {
      fetchPlayers();
    }
  };

  const handleSelectPlayer = (player) => {
    if (editingPlayer?.id === player.id) return;
    setEditingPlayer(player);
    setInputName(player.name);
    setInputScore(String(player.score));
    setImagePreview(player.image || null);
  };

  const handleClearEdit = () => {
    setEditingPlayer(null);
    setInputName('');
    setInputScore('');
    setImagePreview(null);
  };

  const handleImageClick = () => {
    const name = inputName.trim() || 'MHF_Steve';
    setImagePreview(minotarUrl(name));
  };

  const handleAdd = async () => {
    const name = inputName.trim();
    if (!name) return;
    const fd = new FormData();
    fd.append('name',  name);
    fd.append('score', inputScore === '' ? '0' : inputScore);
    if (imagePreview) fd.append('image_url', imagePreview);
    try {
      const res    = await fetch(`${API}?action=add`, { method: 'POST', body: fd });
      const player = await res.json();
      if (!player.error) {
        setPlayers(prev => sortPlayers([...prev, player]));
        setScoreStates(prev => ({ ...prev, [player.id]: 'up' }));
        handleClearEdit();
      }
    } catch (e) {
      console.error('Add failed', e);
    }
  };

  const handleUpdate = async () => {
    const name = inputName.trim();
    if (!editingPlayer || !name) return;
    const oldScore = editingPlayer.score;
    const newScore = inputScore === '' ? 0 : Number(inputScore);
    const fd = new FormData();
    fd.append('name',  name);
    fd.append('score', String(newScore));
    if (imagePreview) fd.append('image_url', imagePreview);
    try {
      const res    = await fetch(`${API}?action=update&id=${editingPlayer.id}`, { method: 'POST', body: fd });
      const player = await res.json();
      if (!player.error) {
        setPlayers(prev => sortPlayers(prev.map(p => p.id === player.id ? player : p)));
        setScoreStates(prev => ({
          ...prev,
          [player.id]: newScore > oldScore ? 'up' : newScore < oldScore ? 'down' : prev[player.id],
        }));
        handleClearEdit();
      }
    } catch (e) {
      console.error('Update failed', e);
    }
  };

  const handleDelete = async () => {
    if (!editingPlayer) return;
    try {
      await fetch(`${API}?action=delete&id=${editingPlayer.id}`, { method: 'POST' });
      setPlayers(prev => prev.filter(p => p.id !== editingPlayer.id));
      setScoreStates(prev => { const n = { ...prev }; delete n[editingPlayer.id]; return n; });
      handleClearEdit();
    } catch (e) {
      console.error('Delete failed', e);
    }
  };

  const isEditMode = editingPlayer !== null;

  return (
    <div ref={rootRef} className='view-players' onClick={handleClearEdit}>

      <div className="leaderboard-labels">
        <div className="left">
          <div className="status-light"></div>
          <div className="leaderboard-position">
            <svg className='icon mc-dim' xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
              <path d="M80-120v-480h220v480H80Zm290 0v-720h220v720H370Zm290 0v-400h220v400H660Z"/>
            </svg>
          </div>
          <div className="player-head">
            <svg className='icon mc-dim' xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
              <path d="M579-481q41-41 41-99t-41-99q-41-41-99-41t-99 41q-41 41-41 99t41 99q41 41 99 41t99-41ZM120-120v-720h720v720H120Zm80-80h560v-46q-54-53-125.5-83.5T480-360q-83 0-154.5 30.5T200-246v46Z"/>
            </svg>
          </div>
          <div className="player-name">
            <p className="mc-dim">Username</p>
          </div>
        </div>
        <div className="right">
          <div className="player-score">
            <p className="mc-dim">SCORE</p>
          </div>
          <div className="controls">
            <p className="mc-dim">VOTE</p>
          </div>
        </div>
      </div>

      <div className={`leaderboard-scroll-wrapper${canScrollUp ? ' fade-top' : ''}${canScrollDown ? ' fade-bottom' : ''}`}>
        <div className="leaderboard-scroll" ref={scrollRef}>
          <Leaderboard
            players={players}
            onVote={handleVote}
            onSelectPlayer={handleSelectPlayer}
            selectedPlayerId={editingPlayer?.id ?? null}
            scoreStates={scoreStates}
          />
        </div>
      </div>

      <div
        className={`data-management${isEditMode ? ' edit-mode' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="player-head" onClick={handleImageClick} title="Click to load Minecraft skin">
          <img src={imagePreview || unknownPlayer} alt="avatar" />
        </div>
        <input
          className="username-input"
          type="text"
          maxLength="16"
          placeholder="PlayerName"
          value={inputName}
          onChange={e => setInputName(e.target.value)}
        />
        <input
          className="score-input"
          type="number"
          placeholder="0"
          value={inputScore}
          onChange={e => setInputScore(e.target.value)}
        />
        {isEditMode && (
          <button className="delete-btn" onClick={handleDelete} title="Delete player">
            <svg className='icon mc-white' xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
              <path d="M200-120v-600h-40v-80h200v-40h240v40h200v80h-40v600H200Zm80-80h400v-520H280v520Zm80-80h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/>
            </svg>
          </button>
        )}
        <button
          className={`manage-data-btn${isEditMode ? ' update-mode' : ''}`}
          onClick={isEditMode ? handleUpdate : handleAdd}
        >
          <span className="btn-label">{isEditMode ? 'Update' : 'Add'}</span>
        </button>
      </div>

    </div>
  );
}

export default App;