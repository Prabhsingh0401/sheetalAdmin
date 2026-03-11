import { useState, useEffect } from "react";
import { getMostViewedProducts } from "../services/productService";

export function useMostViewed(limit = 5) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getMostViewedProducts(limit)
      .then(setItems)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [limit]);

  return { items, loading, error };
}