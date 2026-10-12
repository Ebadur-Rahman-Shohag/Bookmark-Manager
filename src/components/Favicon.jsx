import { useState } from 'react';
import { getFaviconUrl } from '../lib/bookmarks.js';
import { BookmarkIcon } from './icons.jsx';

const Favicon = ({ link }) => {
  const [failed, setFailed] = useState(false);
  const url = getFaviconUrl(link);

  return (
    <div className="bc-favicon" aria-hidden="true">
      {url && !failed ? (
        <img src={url} alt="" loading="lazy" onError={() => setFailed(true)} />
      ) : (
        <span className="bc-favicon-fallback">
          <BookmarkIcon size={16} />
        </span>
      )}
    </div>
  );
};

export default Favicon;
