import React from 'react';
import { FaStar, FaRegStar } from 'react-icons/fa';

const RatingStars = ({ rating = 0, onRate, readonly = false, size = 'md' }) => {
  const iconSize = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-2xl' : 'text-lg';

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onRate && onRate(star)}
          className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110 transition-transform'}`}
        >
          {star <= rating ? (
            <FaStar className={`${iconSize} text-yellow-400`} />
          ) : (
            <FaRegStar className={`${iconSize} text-gray-500 hover:text-yellow-400/50`} />
          )}
        </button>
      ))}
    </div>
  );
};

export default RatingStars;
