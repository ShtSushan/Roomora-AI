import { useEffect } from "react";

// Sets the browser tab title, e.g. "My projects | Roomora AI".
export default function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | Roomora AI` : "Roomora AI | AI interior design";
  }, [title]);
}