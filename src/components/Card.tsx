import type { Card } from '../types/game';
import './Card.css';

interface CardProps {
  card: Card;
  onClick: (id: string) => void;
  isHinted: boolean;
  disabled: boolean;
}

export function CardTile({ card, onClick, isHinted, disabled }: CardProps) {
  const isFaceUp = card.state === 'face-up' || card.state === 'matched';
  const isMatched = card.state === 'matched';

  const handleClick = () => {
    if (!disabled && card.state === 'face-down') {
      onClick(card.id);
    }
  };

  let className = 'card-tile';
  if (isFaceUp) className += ' face-up';
  if (isMatched) className += ' matched';
  if (isHinted) className += ' hinted';
  if (card.type === 'word') className += ' word-card';
  if (card.type === 'definition') className += ' definition-card';
  if (disabled || card.state !== 'face-down') className += ' no-click';

  return (
    <div
      className={className}
      onClick={handleClick}
      role="button"
      aria-label={isFaceUp ? card.content : `Face-down ${card.type} card`}
      tabIndex={disabled || card.state !== 'face-down' ? -1 : 0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      <div className="card-inner">
        <div className="card-back">
          <span className="card-type-label">{card.type === 'word' ? 'W' : 'D'}</span>
        </div>
        <div className="card-front">
          <span className="card-type-badge">{card.type === 'word' ? 'Word' : 'Definition'}</span>
          <p className="card-content">{card.content}</p>
        </div>
      </div>
    </div>
  );
}
