"use client";

import { useEffect, useRef } from "react";

export function useAutoSubmitOnFocusLoss(active: boolean, onAutoSubmit: () => void) {
  const submitRef = useRef(onAutoSubmit);

  useEffect(() => {
    submitRef.current = onAutoSubmit;
  }, [onAutoSubmit]);

  useEffect(() => {
    if (!active) return;
    let submitted = false;
    const submit = () => {
      if (submitted) return;
      submitted = true;
      submitRef.current();
    };
    const handleVisibilityChange = () => {
      if (document.hidden) submit();
    };

    window.addEventListener("blur", submit);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("blur", submit);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [active]);
}
