import { useRouter } from "next/router";
import React from "react";

export const PreviouIcon = () => {
  const { back } = useRouter();
  return (
    <div
      onClick={back}
      role="button"
      className="bg-white p-4 shadow-md rounded-full"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
      >
        <path d="M13.427 3.021h-7.427v-3.021l-6 5.39 6 5.61v-3h7.427c3.071 0 5.561 2.356 5.561 5.427 0 3.071-2.489 5.573-5.561 5.573h-7.427v5h7.427c5.84 0 10.573-4.734 10.573-10.573s-4.733-10.406-10.573-10.406z" />
      </svg>
    </div>
  );
};