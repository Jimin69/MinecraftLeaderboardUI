import unknownPlayer from '../assets/unknown.png';
import './Leaderboard.css';

function LeaderboardItem({ position, player, onVote, onSelect, isSelected, scoreState }) {
  const posClass =
    position === 1 ? 'pos-first'  :
    position === 2 ? 'pos-second' :
    position === 3 ? 'pos-third'  : '';

  const posLarge = position >= 10 ? 'pos-large' : '';

  const scoreClass = scoreState === 'up'
    ? 'mc-lightgray score-up'
    : scoreState === 'down'
      ? 'mc-lightgray score-down'
      : 'mc-lightgray';

  return (
    <div
      className={`list-item${isSelected ? ' selected' : ''}`}
      onClick={e => { e.stopPropagation(); onSelect(player); }}
    >
      <div className="left">
        <div className="status-light"></div>
        <div className="leaderboard-position">
          <p className={['mc-lightgray', posClass, posLarge].filter(Boolean).join(' ')}>
            #{position}
          </p>
        </div>
        <div className="player-head">
          <img src={player.image || unknownPlayer} alt={player.name} />
        </div>
        <div className="player-name">
          <p className='mc-lightgray'>{player.name}</p>
        </div>
      </div>

      <div className="right">
        <div className="player-score">
          <p className={scoreClass}>{player.score}</p>
        </div>
        <div className="controls">
          <button
            className="upvote-player-btn"
            onClick={e => { e.stopPropagation(); onVote(player.id, 'up'); }}
          >
            <svg className='icon mc-white' xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
              <path d="M412-74v-338H74v-136h338v-338h136v338h338v136H548v338H412Z"/>
            </svg>
          </button>
          <button
            className="downvote-player-btn"
            onClick={e => { e.stopPropagation(); onVote(player.id, 'down'); }}
          >
            <svg className='icon mc-white' xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
              <path d="M154-412v-136h652v136H154Z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Leaderboard({ players, onVote, onSelectPlayer, selectedPlayerId, scoreStates }) {
  return (
    <>
      {players.map((player, index) => (
        <LeaderboardItem
          key={player.id}
          position={index + 1}
          player={player}
          onVote={onVote}
          onSelect={onSelectPlayer}
          isSelected={player.id === selectedPlayerId}
          scoreState={scoreStates[player.id] ?? null}
        />
      ))}
    </>
  );
}