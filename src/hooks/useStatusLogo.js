import { useEffect, useState } from 'react';
import { getStatusLogo } from '../services/statusService';

// The studio's logo for the public status page, as a blob: URL (or null while loading, when there
// is none, or if it cannot be fetched: the page then just shows its emoji). `version` changes when
// the logo does, so a replaced logo is fetched again. The URL is released when it is no longer used.
const useStatusLogo = (token, enabled, version) => {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    if (!enabled || !token) {
      setUrl(null);
      return undefined;
    }
    let live = true;
    let objectUrl = null;
    getStatusLogo(token)
      .then(({ data }) => {
        if (!live || !(data instanceof Blob) || !/^image\/(png|jpeg)$/.test(data.type)) return;
        objectUrl = URL.createObjectURL(data);
        setUrl(objectUrl);
      })
      .catch(() => {});
    return () => {
      live = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [token, enabled, version]);
  return url;
};

export default useStatusLogo;
